#!/usr/bin/env node
/**
 * FactStamp — Create Administrator User
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates an admin user in Firebase Auth and provisions their Verifier Profile
 * in Firestore with `isAdmin: true`.
 *
 * Usage:
 *   node scripts/create-admin.mjs [email] [password] [displayName]
 *
 * Example:
 *   node scripts/create-admin.mjs admin@factstamp.app FactStamp@2026 "FactStamp Admin"
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── 1. Load .env ── */

function loadEnv(file = '.env') {
  const env = {}
  if (!existsSync(file)) return env
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    let key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

const env = loadEnv('.env')
const API_KEY = env.VITE_FIREBASE_API_KEY
const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || 'factstamp-app'
const USE_EMULATORS = env.VITE_USE_FIREBASE_EMULATORS === 'true'

if (!API_KEY) {
  console.error('✖ No Firebase API key found in .env')
  process.exit(1)
}

const AUTH_BASE = USE_EMULATORS
  ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
  : 'https://identitytoolkit.googleapis.com/v1'

const FIRESTORE_BASE = USE_EMULATORS
  ? `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

/* ── 2. Parse Arguments ── */

const args = process.argv.slice(2)
const EMAIL = args[0] || 'admin@factstamp.app'
const PASSWORD = args[1] || 'FactStamp@2026'
const DISPLAY_NAME = args[2] || 'FactStamp Admin'

console.log('────────────────────────────────────────────────────────────────────────')
console.log('FactStamp — Admin Account Creation')
console.log('────────────────────────────────────────────────────────────────────────')
console.log(`  Project:      ${PROJECT_ID}`)
console.log(`  Email:        ${EMAIL}`)
console.log(`  Display Name: ${DISPLAY_NAME}`)
console.log('────────────────────────────────────────────────────────────────────────\n')

/* ── 3. Helper Functions ── */

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.error?.message || `HTTP ${res.status}`)
    err.code = body?.error?.code
    err.details = body?.error
    err.status = res.status
    throw err
  }
  return body
}

function toField(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (typeof value === 'string') return { stringValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toField) } }
  if (typeof value === 'object') return { mapValue: { fields: toFields(value) } }
  return { nullValue: null }
}

function toFields(obj) {
  const fields = {}
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = toField(val)
  }
  return fields
}

function updateMask(paths) {
  return paths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&')
}

/* ── 4. Main Provisioning Flow ── */

async function run() {
  // Step A: First authenticate the existing seed admin (Priya Sharma) to get admin auth token
  console.log('1. Authenticating existing seed admin…')
  let seedAdminToken = null
  try {
    const priyaAuth = await api(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ email: 'priya@factstamp.app', password: 'FactStamp@2026', returnSecureToken: true }),
    })
    seedAdminToken = priyaAuth.idToken
    console.log('  ✔ Seed admin authenticated.')
  } catch (err) {
    console.log('  ℹ Notice: Could not sign in with seed admin account, will use direct token if available.')
  }

  // Step B: Create or sign in the target admin account
  console.log(`\n2. Creating/verifying Auth account for ${EMAIL}…`)
  let uid = null
  let userToken = null

  try {
    const created = await api(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    })
    uid = created.localId
    userToken = created.idToken
    console.log(`  ✔ New Firebase Auth user created (uid: ${uid}).`)
  } catch (err) {
    if (err.status === 400 && err.details?.message?.includes('EMAIL_EXISTS')) {
      console.log('  ℹ Account already exists in Firebase Auth. Signing in to retrieve uid…')
      const signedIn = await api(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
      })
      uid = signedIn.localId
      userToken = signedIn.idToken
      console.log(`  ✔ Signed in as ${EMAIL} (uid: ${uid}).`)
    } else {
      throw err
    }
  }

  // Step C: Update displayName in Firebase Auth
  try {
    await api(`${AUTH_BASE}/accounts:update?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ idToken: userToken, displayName: DISPLAY_NAME, returnSecureToken: true }),
    })
    console.log(`  ✔ Display name set to "${DISPLAY_NAME}".`)
  } catch (err) {
    console.warn('  ⚠ Notice: Could not update Auth profile displayName:', err.message)
  }

  // Step D: Write Admin Profile to Firestore users/{uid}
  console.log('\n3. Provisioning Admin clearance in Firestore database…')
  const profileData = {
    uid,
    displayName: DISPLAY_NAME,
    email: EMAIL,
    reputation: 100,
    totalVerifications: 150,
    joinedAt: new Date().toISOString(),
    isAdmin: true,
  }

  // Clear existing document first so it triggers allow create
  if (seedAdminToken) {
    try {
      await api(`${FIRESTORE_BASE}/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${seedAdminToken}` },
      })
    } catch {}
  }

  const mask = updateMask(Object.keys(profileData))
  const url = `${FIRESTORE_BASE}/users/${uid}?${mask}`

  await api(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ fields: toFields(profileData) }),
  })
  console.log(`  ✔ Verifier profile written to users/${uid} with isAdmin: true.`)

  // Step E: Add Audit Log entry
  try {
    const auditData = {
      action: 'Admin Account Created',
      targetType: 'user',
      targetId: uid,
      details: `Administrator account provisioned for ${DISPLAY_NAME} (${EMAIL})`,
      adminName: 'System Provisioner',
      createdAt: new Date().toISOString(),
    }
    const auditToken = seedAdminToken || userToken
    await api(`${FIRESTORE_BASE}/audit_logs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auditToken}` },
      body: JSON.stringify({ fields: toFields(auditData) }),
    })
    console.log('  ✔ Action recorded in audit trail.')
  } catch (err) {
    console.warn('  ⚠ Notice: Audit log write skipped:', err.message)
  }

  console.log('\n────────────────────────────────────────────────────────────────────────')
  console.log('✅ Administrator Account Ready!')
  console.log('────────────────────────────────────────────────────────────────────────')
  console.log(`  Email:        ${EMAIL}`)
  console.log(`  Password:     ${PASSWORD}`)
  console.log(`  Display Name: ${DISPLAY_NAME}`)
  console.log(`  Role:         Admin (isAdmin: true)`)
  console.log(`  Login URL:    http://localhost:5174/signin`)
  console.log(`  Admin URL:    http://localhost:5174/admin`)
  console.log('────────────────────────────────────────────────────────────────────────\n')
}

run().catch((err) => {
  console.error('\n✖ Failed to create admin user:', err.message)
  if (err.details) console.error('Details:', JSON.stringify(err.details, null, 2))
  process.exit(1)
})
