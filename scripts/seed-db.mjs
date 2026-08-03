#!/usr/bin/env node
/**
 * FactStamp — Database Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates 7 real Firebase Auth accounts (email/password), writes their Verifier
 * Profiles to Firestore `users/{uid}`, and seeds the demo claims + verifications
 * into the `claims` collection.
 *
 * Everything is fetched from Firebase going forward — there is NO mock data in
 * the app bundle. This script is the one-time (and re-runnable, idempotent)
 * way to populate the database.
 *
 * Usage:
 *   npm run seed:db                     # → real cloud project (from .env)
 *   VITE_USE_FIREBASE_EMULATORS=true npm run seed:db   # → Local Emulator Suite
 *
 * Notes:
 *  - Reads VITE_FIREBASE_* from .env (no secrets are hardcoded here).
 *  - Emails are fixed per display-name so re-runs sign in instead of erroring.
 *  - Claim writes are two-phase (create verificationCount=0, then update with
 *    full consensus data) so they satisfy the deployed Firestore security rules.
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

if (!API_KEY || API_KEY.includes('Demo') || API_KEY.includes('YOUR_')) {
  console.error('✖ No real Firebase API key found. Add VITE_FIREBASE_API_KEY to .env first.')
  process.exit(1)
}

/* ── 2. REST endpoint bases ── */

const AUTH_BASE = USE_EMULATORS
  ? 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
  : 'https://identitytoolkit.googleapis.com/v1'

const FIRESTORE_BASE = USE_EMULATORS
  ? `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

/* ── 3. Seed data ── */

const PASSWORD = 'FactStamp@2026'

// Order matters: index 0 → 'u1', index 1 → 'u2', ... (uid references are
// remapped to the real Firebase uids created below).
const SEED_USERS = [
  { name: 'Priya Sharma', email: 'priya@factstamp.app', reputation: 95, totalVerifications: 112, joinedAt: '2025-01-15T08:00:00Z' },
  { name: 'Raj Patel', email: 'raj@factstamp.app', reputation: 94, totalVerifications: 98, joinedAt: '2024-11-03T10:30:00Z' },
  { name: 'Vikram Singh', email: 'vikram@factstamp.app', reputation: 91, totalVerifications: 84, joinedAt: '2024-09-12T06:45:00Z' },
  { name: 'Ananya Gupta', email: 'ananya@factstamp.app', reputation: 88, totalVerifications: 62, joinedAt: '2025-03-20T14:00:00Z' },
  { name: 'Aarav Mehta', email: 'aarav@factstamp.app', reputation: 82, totalVerifications: 45, joinedAt: '2025-04-10T11:15:00Z' },
  { name: 'Neha Joshi', email: 'neha@factstamp.app', reputation: 78, totalVerifications: 31, joinedAt: '2025-05-01T12:00:00Z' },
  { name: 'Kavya Nair', email: 'kavya@factstamp.app', reputation: 65, totalVerifications: 19, joinedAt: '2025-06-05T16:20:00Z' },
]

// Helper to build a Verification object for a claim.
const v = (id, claimId, verdict, sourceUrl, sourceQuality, explanation, verifierName, createdAt) => ({
  id,
  claimId,
  verdict,
  sourceUrl,
  sourceQuality,
  explanation,
  verifierName,
  createdAt,
  // verifierId + verifierReputation are resolved after accounts exist
})

// Mirrors the old demo data — kept ONLY in this script as the seed source.
const SEED_CLAIMS = [
  {
    id: 'c1',
    text: 'Dengue fever can be cured by eating neem leaves and taking antibiotics within 24 hours of symptoms appearing. Forward this to all your family groups!',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-20T08:00:00Z',
    consensusDeadline: '2026-07-27T08:00:00Z',
    submittedByName: 'Priya Sharma',
    verdict: 'FALSE',
    confidenceScore: 97,
    agreementRatio: 1.0,
    sourceQualityScore: 95,
    verifications: [
      v('v1', 'c1', 'FALSE', 'https://who.int/dengue-treatment-guidelines', 'high',
        "WHO guidelines clearly state no specific treatment exists for dengue. Paracetamol is recommended for fever management, not antibiotics which are ineffective against viral infections. The 'neem leaf cure' has no peer-reviewed evidence.",
        'Raj Patel', '2025-06-10T09:15:00Z'),
      v('v2', 'c1', 'FALSE', 'https://ncbi.nlm.nih.gov/dengue-management', 'high',
        'The NCBI review confirms WHO position — no antiviral drug for dengue. Supportive care is the only recommended approach. Misinformation about antibiotics for dengue can lead to antibiotic resistance.',
        'Vikram Singh', '2025-06-10T11:30:00Z'),
      v('v3', 'c1', 'FALSE', 'https://timesofindia.indiatimes.com/dengue-myths', 'medium',
        'The Times of India fact-check cites multiple health officials debunking this claim. No government health agency recommends neem leaves or antibiotics for dengue treatment.',
        'Priya Sharma', '2025-06-10T14:00:00Z'),
    ],
  },
  {
    id: 'c2',
    text: 'You can use your Aadhaar card as a valid document to apply for a new voter ID card in India.',
    category: 'political',
    status: 'verified',
    createdAt: '2026-07-19T07:00:00Z',
    consensusDeadline: '2026-07-26T07:00:00Z',
    submittedByName: 'Ananya Gupta',
    verdict: 'TRUE',
    confidenceScore: 98,
    agreementRatio: 1.0,
    sourceQualityScore: 100,
    verifications: [
      v('v4', 'c2', 'TRUE', 'https://eci.gov.in/voter-id-requirements', 'high',
        "According to the Election Commission of India, Aadhaar is listed as one of the accepted documents for voter ID application (Form 6). This is correct — it's among 12+ accepted ID proofs.",
        'Vikram Singh', '2025-06-09T08:00:00Z'),
      v('v5', 'c2', 'TRUE', 'https://ceodelhi.gov.in/voter-registration', 'high',
        'The Delhi CEO website confirms Aadhaar is an accepted document for voter registration. This claim is accurate.',
        'Raj Patel', '2025-06-09T10:20:00Z'),
    ],
  },
  {
    id: 'c3',
    text: 'The Election Commission has made it mandatory for every voter to have a separate mobile phone linked to their voter ID. Without a personal phone, your vote will be rejected.',
    category: 'political',
    status: 'verified',
    createdAt: '2026-07-18T11:00:00Z',
    consensusDeadline: '2026-07-25T11:00:00Z',
    submittedByName: 'Neha Joshi',
    verdict: 'FALSE',
    confidenceScore: 94,
    agreementRatio: 1.0,
    sourceQualityScore: 85,
    verifications: [
      v('v6', 'c3', 'FALSE', 'https://indianexpress.com/election-eligibility-facts', 'medium',
        'The Indian Express fact-check clarifies that no Indian law requires voters to have a separate mobile phone for their ID. This is a viral WhatsApp rumor without basis in the Representation of the People Act, 1951.',
        'Priya Sharma', '2025-06-08T16:00:00Z'),
    ],
  },
  {
    id: 'c4',
    text: 'If NOTA (None of the Above) gets the most votes in an election, the winning candidate is automatically disqualified and the election is declared void.',
    category: 'political',
    status: 'verified',
    createdAt: '2026-07-17T09:30:00Z',
    consensusDeadline: '2026-07-24T09:30:00Z',
    submittedByName: 'Vikram Singh',
    verdict: 'MISLEADING',
    confidenceScore: 89,
    agreementRatio: 1.0,
    sourceQualityScore: 90,
    verifications: [
      v('v7', 'c4', 'MISLEADING', 'https://pib.gov.in/eci-clarification', 'high',
        "The PIB fact-check found the claim MISLEADING. While the viral message correctly states that NOTA exists, it's misleading to claim NOTA votes directly cancel the winning candidate's victory — NOTA only triggers a re-poll if NOTA gets the highest votes.",
        'Raj Patel', '2025-06-07T12:00:00Z'),
    ],
  },
  {
    id: 'c5',
    text: 'Drinking kadha (herbal decoction) made of ginger, tulsi, and black pepper every morning can prevent COVID-19 infection. Government of India recommends this.',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-16T06:00:00Z',
    consensusDeadline: '2026-07-23T06:00:00Z',
    submittedByName: 'Neha Joshi',
    verdict: 'MISLEADING',
    confidenceScore: 86,
    agreementRatio: 1.0,
    sourceQualityScore: 85,
    verifications: [
      v('v8', 'c5', 'MISLEADING', 'https://ayush.gov.in/ayurveda-covid', 'high',
        'While the Ministry of AYUSH does recommend certain practices for general wellness, no clinical trial data shows these specific remedies prevent COVID-19. The message overstates efficacy.',
        'Ananya Gupta', '2025-06-10T07:00:00Z'),
      v('v9', 'c5', 'MISLEADING', 'https://icmr.gov.in/covid-guidelines', 'high',
        'ICMR guidelines emphasize vaccination and masks as primary prevention. The AYUSH remedies mentioned may support general immunity but are not proven to prevent COVID infection.',
        'Vikram Singh', '2025-06-10T09:45:00Z'),
    ],
  },
  {
    id: 'c6',
    text: 'IIT Madras is offering a ₹50,000 scholarship for all students from government schools who score above 90% in Class 12. Apply before June 30 through the link below.',
    category: 'financial',
    status: 'verified',
    createdAt: '2026-07-16T14:00:00Z',
    consensusDeadline: '2026-07-23T14:00:00Z',
    submittedByName: 'Ananya Gupta',
    verdict: 'FALSE',
    confidenceScore: 92,
    agreementRatio: 1.0,
    sourceQualityScore: 80,
    verifications: [
      v('v10', 'c6', 'FALSE', 'https://iitm.org/scholarship-factcheck', 'medium',
        'The IIT Madras fact-check clarifies this scholarship scheme does not exist. No official announcement has been made about a ₹50,000 scholarship for IIT aspirants from government schools.',
        'Neha Joshi', '2025-06-06T15:30:00Z'),
    ],
  },
  {
    id: 'c7',
    text: 'The government has launched a new toll-free helpline 14420 for reporting COVID-19 and health emergencies.',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-15T10:00:00Z',
    consensusDeadline: '2026-07-22T10:00:00Z',
    submittedByName: 'Priya Sharma',
    verdict: 'TRUE',
    confidenceScore: 95,
    agreementRatio: 1.0,
    sourceQualityScore: 100,
    verifications: [
      v('v11', 'c7', 'TRUE', 'https://mohfw.gov.in/helpline', 'high',
        'The Ministry of Health confirmed this helpline number through their official channels. The number matches the government portal listing.',
        'Priya Sharma', '2025-06-05T11:00:00Z'),
    ],
  },
  {
    id: 'c8',
    text: 'Taking zinc supplements can cure the common cold within 24 hours.',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-14T08:00:00Z',
    consensusDeadline: '2026-07-21T08:00:00Z',
    submittedByName: 'Raj Patel',
    verdict: 'CONTESTED',
    confidenceScore: 71,
    agreementRatio: 1.0,
    sourceQualityScore: 65,
    verifications: [
      v('v12', 'c8', 'CONTESTED', 'https://factcheck.org/common-cold-medicine', 'medium',
        'Medical professionals disagree on this. Some studies suggest zinc lozenges may reduce cold duration by 1-2 days, while others show no significant effect. More research needed.',
        'Ananya Gupta', '2025-06-04T14:20:00Z'),
    ],
  },
  {
    id: 'c9',
    text: 'Mobile phone radiation causes brain cancer — this has been proven by a WHO study published in 2023.',
    category: 'health',
    status: 'pending',
    createdAt: '2026-07-28T16:00:00Z',
    consensusDeadline: '2026-08-04T16:00:00Z',
    submittedByName: 'Ananya Gupta',
    verifications: [],
  },
  {
    id: 'c10',
    text: 'The government is planning to impose a 28% GST on all religious donations made through digital payment platforms.',
    category: 'religious',
    status: 'pending',
    createdAt: '2026-07-25T13:00:00Z',
    consensusDeadline: '2026-08-01T13:00:00Z',
    submittedByName: 'Priya Sharma',
    verifications: [],
  },
  {
    id: 'c11',
    text: 'A new RBI rule effective July 1 requires all bank accounts to have Aadhaar linked or they will be frozen.',
    category: 'financial',
    status: 'pending',
    createdAt: '2026-07-23T15:00:00Z',
    consensusDeadline: '2026-07-30T15:00:00Z',
    submittedByName: 'Neha Joshi',
    verifications: [],
    // Pre-flagged by the admin for expedited review (surfaces first in queue)
    adminFlagged: true,
    adminFlaggedAt: '2026-07-29T10:00:00Z',
  },
  {
    id: 'c12',
    text: 'Eating bananas at night causes respiratory problems and should be avoided. This is an ancient Ayurvedic teaching.',
    category: 'other',
    status: 'pending',
    createdAt: '2026-07-29T18:00:00Z',
    consensusDeadline: '2026-08-05T18:00:00Z',
    submittedByName: 'Ananya Gupta',
    verifications: [],
  },
]

/* ── 3.5 Notification seed data ── */

// Each account gets 3 notifications (mix of unread + read, referencing real
// seeded claims). createdAt is relative to seed time so the bell shows recent
// activity on first sign-in.
function buildSeedNotifications() {
  const t = (hoursAgo) => new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString()
  return [
    {
      type: 'claim_verified',
      title: 'Consensus Reached: FALSE',
      message: 'Claim "Dengue fever can be cured by eating neem leaves…" reached 3 verifications and hit a final consensus verdict.',
      createdAt: t(2),
      isRead: false,
      claimId: 'c1',
    },
    {
      type: 'reputation_update',
      title: 'Reputation Score Boost',
      message: 'Your reputation increased for casting an accurate consensus verdict.',
      createdAt: t(26),
      isRead: false,
    },
    {
      type: 'weekly_report',
      title: 'Weekly Misinfo Digest',
      message: '42 WhatsApp claims were debunked across India this week.',
      createdAt: t(50),
      isRead: true,
    },
  ]
}

/* ── 4. Small helpers ── */

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

/* ── 5. Auth: create or sign in each account ── */

async function ensureAccount(user) {
  // 1) Try to create
  try {
    const created = await api(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: PASSWORD, returnSecureToken: true }),
    })
    return { ...user, uid: created.localId, idToken: created.idToken, created: true }
  } catch (err) {
    if (err.status === 400 && err.details?.message?.includes('EMAIL_EXISTS')) {
      // 2) Account exists → sign in to get a fresh token
      const signedIn = await api(`${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email, password: PASSWORD, returnSecureToken: true }),
      })
      return { ...user, uid: signedIn.localId, idToken: signedIn.idToken, created: false }
    }
    throw err
  }
}

/* ── 6. Write a Firestore doc (insert-or-update) ── */

async function writeDoc(path, data, idToken, { createOnly = false } = {}) {
  // Two-phase strategy for claims:
  //   create (verificationCount == 0 passes the create rule) then update
  //   with the full consensus payload (verificationCount only grows).
  const url = `${FIRESTORE_BASE}/${path}`
  if (createOnly) {
    return await api(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ fields: toFields(data) }),
    })
  }
  return await api(`${url}?${updateMask(Object.keys(data))}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields: toFields(data) }),
  })
}

/* ── 7. Main ── */

async function main() {
  const target = USE_EMULATORS ? 'Local Emulator Suite' : `cloud project (${PROJECT_ID})`
  console.log(`\nFactStamp DB seed → ${target}\n`)

  // ── Accounts ──
  console.log('Creating / signing in 7 accounts…')
  const accounts = []
  for (const user of SEED_USERS) {
    const acc = await ensureAccount(user)
    accounts.push(acc)
    console.log(`  ${acc.created ? 'created' : 'exists '} → ${acc.email} (uid ${acc.uid.slice(0, 6)}…)`)
  }

  // ── User profiles (owner-only writes, so each uses its own token) ──
  console.log('\nWriting verifier profiles…')
  for (const acc of accounts) {
    const profile = {
      uid: acc.uid,
      displayName: acc.name,
      email: acc.email,
      reputation: acc.reputation,
      totalVerifications: acc.totalVerifications,
      joinedAt: acc.joinedAt,
      // Priya Sharma is the demo admin — unlocks the Expedited Review panel
      isAdmin: acc.name === 'Priya Sharma',
    }
    await writeDoc(`users/${acc.uid}`, profile, acc.idToken)
  }
  console.log(`  ${accounts.length} profiles written to users/{uid}`)

  // uid-name map for remapping claim references to real uids
  const uidByName = new Map(accounts.map((a) => [a.name, a.uid]))

  // ── Claims ──
  console.log('\nSeeding claims…')
  // Any authenticated user may create claims (auth-only create rule).
  const seedToken = accounts[0].idToken
  let created = 0
  let updated = 0

  for (const claim of SEED_CLAIMS) {
    const verifications = claim.verifications.map((verif) => ({
      ...verif,
      verifierId: uidByName.get(verif.verifierName) || 'seed-unknown',
      verifierReputation:
        accounts.find((a) => a.name === verif.verifierName)?.reputation ?? 50,
    }))

    const avgRep = verifications.length
      ? Math.round((verifications.reduce((s, x) => s + x.verifierReputation, 0) / verifications.length) * 10) / 10
      : undefined

    // Optional consensus fields (and verifiedAt) only exist on verified claims.
    // Firestore REST deletes a field when it appears in updateMask but is ABSENT
    // from the body, so for pending claims we list those keys in the mask while
    // leaving them out of the payload — the PATCH removes any stale fields.
    const optionalKeys = ['verdict', 'confidenceScore', 'agreementRatio', 'avgVerifierReputation', 'sourceQualityScore', 'verifiedAt']
    const isVerified = claim.status === 'verified'
    const finalData = Object.fromEntries(
      Object.entries({
        text: claim.text,
        category: claim.category,
        status: claim.status,
        createdAt: claim.createdAt,
        consensusDeadline: claim.consensusDeadline,
        submittedBy: uidByName.get(claim.submittedByName) || 'seed-unknown',
        submittedByName: claim.submittedByName,
        ...(isVerified
          ? {
              verdict: claim.verdict,
              confidenceScore: claim.confidenceScore,
              agreementRatio: claim.agreementRatio,
              avgVerifierReputation: avgRep,
              sourceQualityScore: claim.sourceQualityScore,
              verifiedAt: claim.createdAt,
            }
          : {}),
        verificationCount: verifications.length,
        verifications,
      }).filter(([, value]) => value !== undefined)
    )
    const mask = isVerified ? Object.keys(finalData) : [...Object.keys(finalData), ...optionalKeys]

    // Create-phase payload must satisfy the create rule (verificationCount == 0)
    const createData = {
      text: claim.text,
      category: claim.category,
      status: claim.status,
      createdAt: claim.createdAt,
      consensusDeadline: claim.consensusDeadline,
      submittedBy: finalData.submittedBy,
      submittedByName: claim.submittedByName,
      verificationCount: 0,
      verifications: [],
    }

    try {
      await api(`${FIRESTORE_BASE}/claims?documentId=${claim.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${seedToken}` },
        body: JSON.stringify({ fields: toFields(createData) }),
      })
      created++
    } catch (err) {
      if (err.status !== 409) throw err // ALREADY_EXISTS → just update below
    }

    await api(`${FIRESTORE_BASE}/claims/${claim.id}?${updateMask(mask)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${seedToken}` },
      body: JSON.stringify({ fields: toFields(finalData) }),
    })
    updated++
  }
  console.log(`  ${created} claims created, ${updated} claims updated (12 total)`)

  // ── Notifications (owner-only writes, so each uses its own token) ──
  console.log('\nSeeding notifications…')
  let notifCreated = 0
  let notifUpdated = 0
  for (const acc of accounts) {
    const items = buildSeedNotifications()
    for (const [i, item] of items.entries()) {
      const data = { ...item, userId: acc.uid }
      const docId = `n_${acc.uid.slice(0, 8)}_${i + 1}`
      try {
        await api(`${FIRESTORE_BASE}/notifications?documentId=${docId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${acc.idToken}` },
          body: JSON.stringify({ fields: toFields(data) }),
        })
        notifCreated++
      } catch (err) {
        if (err.status !== 409) throw err // ALREADY_EXISTS → update below
        await api(`${FIRESTORE_BASE}/notifications/${docId}?${updateMask(Object.keys(data))}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${acc.idToken}` },
          body: JSON.stringify({ fields: toFields(data) }),
        })
        notifUpdated++
      }
    }
  }
  console.log(`  ${notifCreated} notifications created, ${notifUpdated} updated (${accounts.length * 3} total)`)

  /* ── 8. Account list ── */
  console.log('\n' + '─'.repeat(72))
  console.log('✅ Seed complete. Accounts (email / password):')
  console.log('─'.repeat(72))
  for (const acc of accounts) {
    console.log(`  ${acc.email.padEnd(28)} ${PASSWORD}   (${acc.name})`)
  }
  console.log('─'.repeat(72))
  console.log(`\nPassword for all accounts: ${PASSWORD}\n`)
}

main().catch((err) => {
  console.error('\n✖ Seed failed:', err.message)
  if (err.details?.error?.message) console.error('  ', err.details.error.message)
  process.exit(1)
})
