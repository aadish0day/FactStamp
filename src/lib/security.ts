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

// ─── 10. Quality & Anti-Misuse: Verdict Explanation Validation ───────────────

export interface ExplanationValidationResult {
  valid: boolean
  error?: string
  warning?: string
  charCount: number
  wordCount: number
  minChars: number
  maxChars: number
  minWords: number
}

/**
 * Validates a verifier's explanation to prevent spam, low-effort cop-outs,
 * excessive character padding, and malicious payloads.
 */
export function validateVerdictExplanation(
  rawText: string,
  claimText?: string
): ExplanationValidationResult {
  const minChars = 50
  const maxChars = 1500
  const minWords = 8

  const text = rawText.trim()
  const charCount = text.length
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length

  // 1. Minimum character length (defense against empty/incomplete verification)
  if (charCount < minChars) {
    return {
      valid: false,
      error: `Explanation is too short (${charCount}/${minChars} characters). Please detail why the source supports your verdict.`,
      charCount,
      wordCount,
      minChars,
      maxChars,
      minWords,
    }
  }

  // 2. Maximum character length (defense against payload bloat & Firestore document limit)
  if (charCount > maxChars) {
    return {
      valid: false,
      error: `Explanation exceeds the maximum limit (${charCount}/${maxChars} characters). Please keep it concise.`,
      charCount,
      wordCount,
      minChars,
      maxChars,
      minWords,
    }
  }

  // 3. Minimum word count (prevents single-word gibberish string padding like 'aaaaa...')
  if (wordCount < minWords) {
    return {
      valid: false,
      error: `Explanation must contain at least ${minWords} words (currently ${wordCount}). Please write complete sentences explaining the facts.`,
      charCount,
      wordCount,
      minChars,
      maxChars,
      minWords,
    }
  }

  // 4. Excessive repetitive character spam (e.g., 'aaaaaa', '......', '!!!!!!')
  if (/(.)\1{5,}/.test(text)) {
    return {
      valid: false,
      error: 'Explanation contains repetitive character patterns. Please write substantive reasoning.',
      charCount,
      wordCount,
      minChars,
      maxChars,
      minWords,
    }
  }

  // 5. Repeated word spam (e.g., 'fake fake fake fake')
  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (let i = 0; i < lowerWords.length - 2; i++) {
    if (lowerWords[i] && lowerWords[i] === lowerWords[i + 1] && lowerWords[i] === lowerWords[i + 2]) {
      return {
        valid: false,
        error: 'Explanation contains repetitive words. Please provide diverse factual evidence.',
        charCount,
        wordCount,
        minChars,
        maxChars,
        minWords,
      }
    }
  }

  // 6. Generic cop-out & filler phrases
  const lower = text.toLowerCase()
  const copOuts = [
    'just trust me',
    'trust me bro',
    'check it yourself',
    'search it on google',
    'search google',
    'idk',
    'i don\'t know',
    'random text to fill space',
    'asdfasdf',
    'qwertyuiop',
  ]
  for (const phrase of copOuts) {
    if (lower.includes(phrase)) {
      return {
        valid: false,
        error: 'Explanation contains low-effort filler phrases. Please cite concrete findings from the source.',
        charCount,
        wordCount,
        minChars,
        maxChars,
        minWords,
      }
    }
  }

  // 7. Duplicate of claim text check (copy-pasting the claim back)
  if (claimText && claimText.trim().length >= 30) {
    const cleanClaim = claimText.trim().toLowerCase()
    if (lower === cleanClaim || (lower.includes(cleanClaim) && text.length < claimText.length + 30)) {
      return {
        valid: false,
        error: 'Explanation cannot simply repeat the claim text. Please explain your research findings.',
        charCount,
        wordCount,
        minChars,
        maxChars,
        minWords,
      }
    }
  }

  // 8. Constructive quality guidance
  let warning: string | undefined
  const hasEvidenceTerms = /(source|report|article|study|ministry|official|evidence|archive|debunk|confirmed|stated|found|according|data|analysis|fact)/i.test(text)
  if (!hasEvidenceTerms) {
    warning = 'Tip: Mention specific evidence or quotes from your cited source to increase community trust.'
  }

  return {
    valid: true,
    warning,
    charCount,
    wordCount,
    minChars,
    maxChars,
    minWords,
  }
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

const LOGIN_ATTEMPT_KEY_PREFIX = 'fs_login_attempts'
const LOGIN_LOCKOUT_KEY_PREFIX = 'fs_login_lockout'
export const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export interface LoginRateLimitResult {
  allowed: boolean
  remainingAttempts: number
  lockoutRemainingMs: number
  isLockedOut: boolean
  totalAttempts: number
}

function getStorageItem(key: string): string | null {
  try {
    const local = localStorage.getItem(key)
    if (local !== null) return local
  } catch {}
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function setStorageItem(key: string, val: string): void {
  try {
    localStorage.setItem(key, val)
  } catch {}
  try {
    sessionStorage.setItem(key, val)
  } catch {}
}

function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {}
  try {
    sessionStorage.removeItem(key)
  } catch {}
}

function sanitizeIdentifierKey(identifier?: string): string {
  if (!identifier) return 'global'
  return identifier.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '_')
}

/**
 * Format remaining lockout milliseconds into MM:SS format
 */
export function formatLockoutRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00'
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Check if a login attempt is permitted under the rate limit.
 * Returns remaining attempts and lockout status.
 */
export function checkLoginRateLimit(identifier?: string): LoginRateLimitResult {
  try {
    const key = sanitizeIdentifierKey(identifier)
    const lockoutKey = `${LOGIN_LOCKOUT_KEY_PREFIX}_${key}`
    const attemptKey = `${LOGIN_ATTEMPT_KEY_PREFIX}_${key}`

    // 1. Check specific identifier lockout
    const lockoutUntil = getStorageItem(lockoutKey)
    if (lockoutUntil) {
      const remaining = parseInt(lockoutUntil, 10) - Date.now()
      if (remaining > 0) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutRemainingMs: remaining,
          isLockedOut: true,
          totalAttempts: MAX_LOGIN_ATTEMPTS,
        }
      }
      // Lockout expired, clean up
      removeStorageItem(lockoutKey)
      removeStorageItem(attemptKey)
    }

    // 2. Also check global client lockout if identifier is specific
    if (key !== 'global') {
      const globalLockout = getStorageItem(`${LOGIN_LOCKOUT_KEY_PREFIX}_global`)
      if (globalLockout) {
        const remaining = parseInt(globalLockout, 10) - Date.now()
        if (remaining > 0) {
          return {
            allowed: false,
            remainingAttempts: 0,
            lockoutRemainingMs: remaining,
            isLockedOut: true,
            totalAttempts: MAX_LOGIN_ATTEMPTS,
          }
        }
        removeStorageItem(`${LOGIN_LOCKOUT_KEY_PREFIX}_global`)
        removeStorageItem(`${LOGIN_ATTEMPT_KEY_PREFIX}_global`)
      }
    }

    const attempts = parseInt(getStorageItem(attemptKey) || '0', 10)
    const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts)
    const isLockedOut = remainingAttempts <= 0

    return {
      allowed: !isLockedOut,
      remainingAttempts,
      lockoutRemainingMs: 0,
      isLockedOut,
      totalAttempts: attempts,
    }
  } catch {
    return {
      allowed: true,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      lockoutRemainingMs: 0,
      isLockedOut: false,
      totalAttempts: 0,
    }
  }
}

/**
 * Record a failed login attempt. Triggers lockout after MAX_LOGIN_ATTEMPTS.
 * Returns the updated rate limit result.
 */
export function recordFailedLogin(identifier?: string): LoginRateLimitResult {
  try {
    const key = sanitizeIdentifierKey(identifier)
    const lockoutKey = `${LOGIN_LOCKOUT_KEY_PREFIX}_${key}`
    const attemptKey = `${LOGIN_ATTEMPT_KEY_PREFIX}_${key}`

    const attempts = parseInt(getStorageItem(attemptKey) || '0', 10) + 1
    setStorageItem(attemptKey, attempts.toString())

    // Also track global failed count
    if (key !== 'global') {
      const globalKey = `${LOGIN_ATTEMPT_KEY_PREFIX}_global`
      const globalAttempts = parseInt(getStorageItem(globalKey) || '0', 10) + 1
      setStorageItem(globalKey, globalAttempts.toString())
      if (globalAttempts >= MAX_LOGIN_ATTEMPTS * 2) {
        setStorageItem(`${LOGIN_LOCKOUT_KEY_PREFIX}_global`, (Date.now() + LOCKOUT_DURATION_MS).toString())
      }
    }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS
      setStorageItem(lockoutKey, lockoutUntil.toString())
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutRemainingMs: LOCKOUT_DURATION_MS,
        isLockedOut: true,
        totalAttempts: attempts,
      }
    }

    return {
      allowed: true,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts,
      lockoutRemainingMs: 0,
      isLockedOut: false,
      totalAttempts: attempts,
    }
  } catch {
    return {
      allowed: true,
      remainingAttempts: 1,
      lockoutRemainingMs: 0,
      isLockedOut: false,
      totalAttempts: 1,
    }
  }
}

/**
 * Reset login attempts on successful authentication.
 */
export function resetLoginAttempts(identifier?: string): void {
  try {
    const key = sanitizeIdentifierKey(identifier)
    removeStorageItem(`${LOGIN_ATTEMPT_KEY_PREFIX}_${key}`)
    removeStorageItem(`${LOGIN_LOCKOUT_KEY_PREFIX}_${key}`)
    // Also reset global client counters
    removeStorageItem(`${LOGIN_ATTEMPT_KEY_PREFIX}_global`)
    removeStorageItem(`${LOGIN_LOCKOUT_KEY_PREFIX}_global`)
  } catch {
    // ignore
  }
}


