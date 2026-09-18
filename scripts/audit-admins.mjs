#!/usr/bin/env node
/**
 * FactStamp — Admin flag audit
 *
 * Lists every users/{uid} document carrying `isAdmin: true` and, with --fix,
 * demotes the ones that are not expected admins.
 *
 * This exists because a bug in the /admin gate used to write `isAdmin: true`
 * onto whichever profile was still in auth state when an admin signed in —
 * i.e. the normal user who had opened the gate. The gate no longer does that,
 * but accounts promoted while the bug was live stay promoted in Firestore.
 *
 * Usage:
 *   node scripts/audit-admins.mjs                       # report only
 *   node scripts/audit-admins.mjs --fix                 # demote unexpected admins
 *   node scripts/audit-admins.mjs --fix --keep a@b.com  # also treat a@b.com as expected
 *
 *   VITE_USE_FIREBASE_EMULATORS=true node scripts/audit-admins.mjs   # → emulators
 */

import { readFileSync } from 'node:fs'

/* ── 1. Env ── */

function loadEnv(file = '.env') {
  const env = {}
  let raw = ''
  try {
    raw = readFileSync(file, 'utf8')
  } catch {
    return env
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
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
const USE_EMULATORS = (process.env.VITE_USE_FIREBASE_EMULATORS || env.VITE_USE_FIREBASE_EMULATORS) === 'true'

if (!API_KEY || API_KEY.includes('Demo') || API_KEY.includes('YOUR_')) {
  console.error('✖ No real Firebase API key found. Add VITE_FIREBASE_API_KEY to .env first.')
  process.exit(1)
}

const AUTH_BASE = USE_EMULATORS
  ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
  : 'https://identitytoolkit.googleapis.com/v1'

const FIRESTORE_BASE = USE_EMULATORS
  ? `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

/* ── 2. Args ── */

const args = process.argv.slice(2)
const APPLY = args.includes('--fix')

// Accounts that are legitimately admins. The seeded demo admin plus anything
// passed with --keep.
const EXPECTED_ADMINS = new Set(['priya@factstamp.app', 'admin@factstamp.app'])
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--keep' && args[i + 1]) EXPECTED_ADMINS.add(args[i + 1].trim().toLowerCase())
}

// Credentials used to authenticate the audit itself. Must be an admin, because
// only isAdmin() may write another user's isAdmin field.
// Reading every profile is admin-only; the demo accounts lost that power
// when the seed allowlist was removed from firestore.rules.
const ADMIN_EMAIL = process.env.FACTSTAMP_ADMIN_EMAIL || 'admin@factstamp.app'
const ADMIN_PASSWORD = process.env.FACTSTAMP_ADMIN_PASSWORD || env.VITE_DEMO_ADMIN_PASSWORD || ''

/* ── 3. REST helpers ── */

async function api(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(body?.error?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.details = body?.error
    throw err
  }
  return body
}

function readField(field) {
  if (!field) return undefined
  if ('booleanValue' in field) return field.booleanValue
  if ('stringValue' in field) return field.stringValue
  if ('integerValue' in field) return Number(field.integerValue)
  if ('doubleValue' in field) return field.doubleValue
  if ('nullValue' in field) return null
  return undefined
}

/* ── 4. Main ── */

async function main() {
  const target = USE_EMULATORS ? 'Local Emulator Suite' : `cloud project (${PROJECT_ID})`
  console.log('\nFactStamp — Admin Flag Audit')
  console.log('─'.repeat(60))
  console.log(`  Target:   ${target}`)
  console.log(`  Mode:     ${APPLY ? 'FIX (will demote unexpected admins)' : 'REPORT ONLY (pass --fix to apply)'}`)
  console.log(`  Expected: ${[...EXPECTED_ADMINS].join(', ')}`)
  console.log('─'.repeat(60) + '\n')

  if (!ADMIN_PASSWORD) {
    console.error('✖ No admin password available.')
    console.error('  Set FACTSTAMP_ADMIN_PASSWORD (and optionally FACTSTAMP_ADMIN_EMAIL), or')
    console.error('  set VITE_DEMO_ADMIN_PASSWORD in .env for the seeded demo admin.')
    process.exit(1)
  }

  console.log(`Signing in as ${ADMIN_EMAIL}…`)
  let idToken
  try {
    const signedIn = await api(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
    })
    idToken = signedIn.idToken
    console.log('  ✔ Authenticated.\n')
  } catch (err) {
    console.error(`  ✖ Sign-in failed: ${err.message}`)
    process.exit(1)
  }

  // Page through users/
  const users = []
  let pageToken
  do {
    const qs = new URLSearchParams({ pageSize: '300' })
    if (pageToken) qs.set('pageToken', pageToken)
    const page = await api(`${FIRESTORE_BASE}/users?${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${idToken}` },
    })
    for (const doc of page.documents || []) {
      const uid = doc.name.split('/').pop()
      users.push({
        uid,
        email: (readField(doc.fields?.email) || '').toLowerCase(),
        displayName: readField(doc.fields?.displayName) || '(no name)',
        isAdmin: readField(doc.fields?.isAdmin) === true,
      })
    }
    pageToken = page.nextPageToken
  } while (pageToken)

  const admins = users.filter((u) => u.isAdmin)
  const unexpected = admins.filter((u) => !EXPECTED_ADMINS.has(u.email))

  console.log(`Scanned ${users.length} profile${users.length === 1 ? '' : 's'}.`)
  console.log(`  Admins found:      ${admins.length}`)
  console.log(`  Unexpected admins: ${unexpected.length}\n`)

  for (const u of admins) {
    const tag = EXPECTED_ADMINS.has(u.email) ? '✔ expected  ' : '⚠ UNEXPECTED'
    console.log(`  ${tag}  ${u.email.padEnd(30)} ${u.displayName}  (uid ${u.uid.slice(0, 8)}…)`)
  }

  if (unexpected.length === 0) {
    console.log('\n✅ No unexpected admin flags. Nothing to do.\n')
    return
  }

  if (!APPLY) {
    console.log(`\nRe-run with --fix to demote the ${unexpected.length} unexpected admin(s).\n`)
    return
  }

  console.log('\nDemoting unexpected admins…')
  let demoted = 0
  for (const u of unexpected) {
    try {
      await api(`${FIRESTORE_BASE}/users/${u.uid}?updateMask.fieldPaths=isAdmin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ fields: { isAdmin: { booleanValue: false } } }),
      })
      console.log(`  ✔ ${u.email} → isAdmin: false`)
      demoted++
    } catch (err) {
      console.error(`  ✖ ${u.email}: ${err.message}`)
    }
  }

  console.log(`\n✅ Demoted ${demoted}/${unexpected.length} account(s).`)
  console.log('   Affected users must sign out and back in to drop the cached admin session.\n')
}

main().catch((err) => {
  console.error('\n✖ Audit failed:', err.message)
  process.exit(1)
})
