/**
 * FactStamp Security Middleware — Defense-in-Depth Hardening
 *
 * This module provides client-side security utilities that complement the
 * server-side Firestore Security Rules. Together they form a layered defense
 * against OWASP Top 10 and advanced web attack vectors.
 *
 * Attack vectors addressed:
 *   07  Access Control          → Role checks, route guards
 *   08  Authentication          → Firebase Auth session validation
 *   09  Session Hijacking       → Secure session flags, idle timeout
 *   10  Client-Side Bypass      → Server-side validation (firestore.rules)
 *   11  Iframe / Clickjacking   → CSP frame-ancestors, X-Frame-Options meta
 *   12  XSS                     → Input sanitization, CSP, React auto-escape
 *   13  CORS                    → Firebase SDK uses origin-bound tokens
 *   14  CSRF                    → Bearer token auth (no ambient cookies)
 *   15  WebSocket Hijacking     → Firebase SDK authenticated WebSocket frames
 *   16  SQL Injection           → No SQL engine (Firestore document DB)
 *   17  File Upload             → MIME + extension + magic byte + size validation
 *   18  LFI / RFI               → No server-side file inclusion (SPA)
 *   19  Command Injection       → No server-side shell execution (SPA)
 *   20  SSRF                    → No server-side HTTP requests from client
 *   21  XXE                     → No XML parsing
 *   22  NoSQL Injection         → Firestore SDK parameterized queries
 *   23  JWT Attacks             → Firebase Auth RS256, no client JWT crafting
 *   24  SSTI                    → No server-side template engine
 */

// ─── 12. XSS: Input Sanitization ─────────────────────────────────────────────

const DANGEROUS_HTML_PATTERN = /<\s*\/?\s*(script|iframe|object|embed|form|link|meta|style|svg|math|base|applet)\b[^>]*>/gi
const DANGEROUS_ATTR_PATTERN = /\b(on\w+|srcdoc|formaction|xlink:href)\s*=/gi
const DANGEROUS_PROTO_PATTERN = /(javascript|vbscript|data)\s*:/gi

/**
 * Sanitize user-provided text to strip dangerous HTML tags, event handler
 * attributes, and dangerous URI schemes. This is a defense-in-depth measure
 * on top of React's automatic JSX escaping.
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  let cleaned = input
    .replace(DANGEROUS_HTML_PATTERN, '')
    .replace(DANGEROUS_ATTR_PATTERN, '')
    .replace(DANGEROUS_PROTO_PATTERN, '')

  // Strip null bytes (used in bypass payloads)
  cleaned = cleaned.replace(/\0/g, '')

  return cleaned.trim()
}

/**
 * Validate and sanitize a URL to ensure it uses only safe protocols.
 * Blocks javascript:, vbscript:, data: (except data:image), and file: URIs.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()

  // Allow http, https, and data:image URIs only
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed
  }

  // Block everything else (javascript:, vbscript:, data:text, file:, etc.)
  return ''
}

// ─── 17. File Upload Attack: Strict Validation ───────────────────────────────

/** Allowed MIME types for image uploads */
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

/** Allowed file extensions */
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
])

/** Magic byte signatures for image formats */
const IMAGE_MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
]

/** Maximum file size: 5 MB */
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Triple-layer file upload validation:
 * 1. Extension whitelist check
 * 2. MIME type whitelist check
 * 3. Magic byte signature verification (prevents MIME spoofing)
 * 4. File size limit enforcement
 */
export async function validateImageUpload(file: File): Promise<FileValidationResult> {
  // Layer 1: File size
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 5 MB.` }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' }
  }

  // Layer 2: Extension whitelist
  const fileName = file.name.toLowerCase()
  const ext = '.' + fileName.split('.').pop()
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Invalid file extension "${ext}". Allowed: .jpg, .png, .webp, .gif` }
  }

  // Layer 3: MIME type whitelist
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { valid: false, error: `Invalid file type "${file.type}". Only image files are accepted.` }
  }

  // Layer 4: Magic byte verification (prevents MIME spoofing attacks)
  try {
    const headerBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const matchesMagicBytes = IMAGE_MAGIC_BYTES.some(({ bytes }) =>
      bytes.every((b, i) => headerBytes[i] === b)
    )

    if (!matchesMagicBytes) {
      return {
        valid: false,
        error: 'File content does not match a valid image format. The file may be corrupted or disguised.',
      }
    }
  } catch {
    return { valid: false, error: 'Unable to verify file integrity.' }
  }

  return { valid: true }
}

// ─── 09. Session Hijacking: Idle Session Timeout ─────────────────────────────

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes of inactivity
const LAST_ACTIVITY_KEY = 'fs_last_activity'

/**
 * Record user activity timestamp. Call on meaningful user interactions.
 */
export function recordActivity(): void {
  try {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
  } catch {
    // sessionStorage may be unavailable in some contexts
  }
}

/**
 * Check if the session has been idle beyond the timeout threshold.
 * Returns true if the session should be considered expired.
 */
export function isSessionExpired(): boolean {
  try {
    const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY)
    if (!lastActivity) return false // First visit, not expired

    const elapsed = Date.now() - parseInt(lastActivity, 10)
    return elapsed > SESSION_TIMEOUT_MS
  } catch {
    return false
  }
}

/**
 * Clear all session-related storage on logout.
 */
export function clearSecuritySession(): void {
  try {
    sessionStorage.removeItem(LAST_ACTIVITY_KEY)
    sessionStorage.removeItem('fs_admin_session_unlocked')
  } catch {
    // ignore
  }
}

// ─── 08. Authentication: Rate Limiting for Login Attempts ────────────────────

const LOGIN_ATTEMPT_KEY = 'fs_login_attempts'
const LOGIN_LOCKOUT_KEY = 'fs_login_lockout'
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export interface LoginRateLimitResult {
  allowed: boolean
  remainingAttempts: number
  lockoutRemainingMs: number
}

/**
 * Check if a login attempt is permitted under the rate limit.
 * Returns remaining attempts and lockout status.
 */
export function checkLoginRateLimit(): LoginRateLimitResult {
  try {
    const lockoutUntil = sessionStorage.getItem(LOGIN_LOCKOUT_KEY)
    if (lockoutUntil) {
      const remaining = parseInt(lockoutUntil, 10) - Date.now()
      if (remaining > 0) {
        return { allowed: false, remainingAttempts: 0, lockoutRemainingMs: remaining }
      }
      // Lockout expired, reset
      sessionStorage.removeItem(LOGIN_LOCKOUT_KEY)
      sessionStorage.removeItem(LOGIN_ATTEMPT_KEY)
    }

    const attempts = parseInt(sessionStorage.getItem(LOGIN_ATTEMPT_KEY) || '0', 10)
    return {
      allowed: attempts < MAX_LOGIN_ATTEMPTS,
      remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts),
      lockoutRemainingMs: 0,
    }
  } catch {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, lockoutRemainingMs: 0 }
  }
}

/**
 * Record a failed login attempt. Triggers lockout after MAX_LOGIN_ATTEMPTS.
 */
export function recordFailedLogin(): void {
  try {
    const attempts = parseInt(sessionStorage.getItem(LOGIN_ATTEMPT_KEY) || '0', 10) + 1
    sessionStorage.setItem(LOGIN_ATTEMPT_KEY, attempts.toString())

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      sessionStorage.setItem(LOGIN_LOCKOUT_KEY, (Date.now() + LOCKOUT_DURATION_MS).toString())
    }
  } catch {
    // ignore
  }
}

/**
 * Reset login attempts on successful authentication.
 */
export function resetLoginAttempts(): void {
  try {
    sessionStorage.removeItem(LOGIN_ATTEMPT_KEY)
    sessionStorage.removeItem(LOGIN_LOCKOUT_KEY)
  } catch {
    // ignore
  }
}

// ─── 22. NoSQL Injection: Input Validation for Firestore Queries ─────────────

/**
 * Validate that a value is safe to use as a Firestore document ID or field value.
 * Prevents NoSQL injection via specially crafted keys with $ operators or
 * __proto__ pollution.
 */
export function isValidFirestoreValue(value: unknown): boolean {
  if (value === null || value === undefined) return false

  if (typeof value === 'string') {
    // Block Firestore reserved prefixes and prototype pollution
    if (value.startsWith('__') && value.endsWith('__')) return false
    if (value.includes('$')) return false
    if (value.length > 1500) return false // Firestore key limit
    return true
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  return typeof value === 'boolean'
}

/**
 * Validate a Firestore document ID (collection path segment).
 */
export function isValidDocumentId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  if (id.length > 1500) return false
  // Must not contain forward slashes or be a reserved Firestore path
  if (id.includes('/') || id.startsWith('.')) return false
  if (id === '__id__' || id === '__name__') return false
  return true
}
