#!/usr/bin/env node
/**
 * FactStamp — Create User CLI (Normal Verifier or Administrator)
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates any user (standard verifier or admin) in Firebase Auth and provisions
 * their Verifier Profile in Cloud Firestore.
 *
 * Usage:
 *   npm run create:user <email> <password> "<DisplayName>" [--admin]
 *
 * Examples:
 *   npm run create:user verifier@example.com FactStamp@2026 "Alex Mercer"
 *   npm run create:user lead@example.com FactStamp@2026 "Lead Admin" --admin
 */

import { readFileSync, existsSync } from 'node:fs'

/* ── 1. Load Environment Configuration ── */

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

/* ── 2. Parse CLI Arguments ── */

const rawArgs = process.argv.slice(2)
const isAdmin = rawArgs.includes('--admin')
const positionalArgs = rawArgs.filter((a) => !a.startsWith('--'))

const EMAIL = positionalArgs[0]
const PASSWORD = positionalArgs[1] || 'FactStamp@2026'
const DISPLAY_NAME = positionalArgs[2] || (isAdmin ? 'FactStamp Admin' : 'FactStamp Verifier')

if (!EMAIL) {
  console.log('Usage:')
  console.log('  npm run create:user <email> [password] [displayName] [--admin]')
  console.log('\nExamples:')
  console.log('  npm run create:user verifier@example.com MyPass@123 "John Doe"')
  console.log('  npm run create:user admin@example.com MyPass@123 "Admin Jane" --admin\n')
  process.exit(1)
}

console.log('────────────────────────────────────────────────────────────────────────')
console.log(`FactStamp — Provisioning ${isAdmin ? 'Administrator' : 'Normal Verifier'} Account`)
console.log('────────────────────────────────────────────────────────────────────────')
console.log(`  Project:      ${PROJECT_ID}`)
console.log(`  Email:        ${EMAIL}`)
console.log(`  Display Name: ${DISPLAY_NAME}`)
console.log(`  Role:         ${isAdmin ? 'Administrator (isAdmin: true)' : 'Standard Verifier (isAdmin: false)'}`)
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
  // Step A: If creating an admin, get admin token from existing seed admin to promote
  let seedAdminToken = null
  if (isAdmin) {
    try {
      const priyaAuth = await api(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ email: 'priya@factstamp.app', password: 'FactStamp@2026', returnSecureToken: true }),
      })
      seedAdminToken = priyaAuth.idToken
    } catch {}
  }

  // Step B: Create or sign in user in Firebase Auth
  console.log(`1. Authenticating/creating Auth identity for ${EMAIL}…`)
  let uid = null
  let userToken = null

  try {
    const created = await api(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    })
    uid = created.localId
    userToken = created.idToken
    console.log(`  ✔ New user identity created in Firebase Auth (uid: ${uid}).`)
  } catch (err) {
    if (err.status === 400 && err.details?.message?.includes('EMAIL_EXISTS')) {
      console.log('  ℹ User already exists in Firebase Auth. Signing in…')
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

  // Step C: Set Display Name
  try {
    await api(`${AUTH_BASE}/accounts:update?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ idToken: userToken, displayName: DISPLAY_NAME, returnSecureToken: true }),
    })
    console.log(`  ✔ Profile displayName set to "${DISPLAY_NAME}".`)
  } catch (err) {
    console.warn('  ⚠ Display name notice:', err.message)
  }

  // Step D: Write Firestore Verifier Profile under users/{uid}
  console.log('\n2. Synchronizing Verifier Profile in Firestore…')

  const profileData = {
    uid,
    displayName: DISPLAY_NAME,
    email: EMAIL,
    reputation: isAdmin ? 100 : 50,
    totalVerifications: isAdmin ? 150 : 0,
    joinedAt: new Date().toISOString(),
    isAdmin: Boolean(isAdmin),
  }

  // Clean existing doc first if present
  if (seedAdminToken || userToken) {
    try {
      await api(`${FIRESTORE_BASE}/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${seedAdminToken || userToken}` },
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
  console.log(`  ✔ Firestore document users/${uid} provisioned (isAdmin: ${isAdmin}).`)

  console.log('\n────────────────────────────────────────────────────────────────────────')
  console.log(`✅ ${isAdmin ? 'Administrator' : 'Normal Verifier'} Account Ready!`)
  console.log('────────────────────────────────────────────────────────────────────────')
  console.log(`  Email:        ${EMAIL}`)
  console.log(`  Password:     ${PASSWORD}`)
  console.log(`  Display Name: ${DISPLAY_NAME}`)
  console.log(`  Role:         ${isAdmin ? 'Admin' : 'Normal Verifier'}`)
  console.log(`  Reputation:   ${profileData.reputation}%`)
  console.log(`  Sign In URL:  http://localhost:5174/signin`)
  if (isAdmin) {
    console.log(`  Admin Panel:  http://localhost:5174/admin`)
  }
  console.log('────────────────────────────────────────────────────────────────────────\n')
}

run().catch((err) => {
  console.error('\n✖ Failed to create user:', err.message)
  if (err.details) console.error('Details:', JSON.stringify(err.details, null, 2))
  process.exit(1)
})
