/**
 * FactStamp — trusted reputation accounting.
 *
 * Reputation and totalVerifications must never be writable by the client: they
 * weight a claim's confidence score, so a self-reported value would let anyone
 * inflate their own influence over consensus. firestore.rules therefore denies
 * every client write to those fields (users/{uid} self-update requires
 * isUnchanged('reputation') && isUnchanged('totalVerifications')).
 *
 * This trigger is the only writer. It runs with Admin SDK privileges, which
 * bypass security rules, and derives every delta from the verification that
 * actually landed in Firestore — never from anything the client asserted.
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

// Mirrors the client's optimistic display maths in computeUpdatedClaim().
const AGREE_REWARD = 2
const DISAGREE_PENALTY = -1
const clamp = (n) => Math.max(0, Math.min(100, n))

const snippet = (text) => {
  const s = typeof text === 'string' ? text.trim() : ''
  return s.length > 80 ? `${s.slice(0, 77)}…` : s
}

// The verdict at least two of three verifiers agree on, or null for a split.
// Recomputed here from the stored verifications — `after.verdict` is written by
// the client and must not decide who gains reputation.
const majorityVerdict = (list) => {
  const counts = new Map()
  for (const v of list) counts.set(v?.verdict, (counts.get(v?.verdict) ?? 0) + 1)
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  if (ranked.length === 0 || (ranked.length > 1 && ranked[0][1] === ranked[1][1])) return null
  return ranked[0][0]
}

// uid -> reputation delta for scoring `list` against `verdict`; `sign` -1 undoes it.
const scoreAgainst = (list, verdict, sign = 1) => {
  const deltas = new Map()
  for (const v of list) {
    const uid = v?.verifierId
    if (typeof uid !== 'string' || !uid) continue
    const delta = sign * (v.verdict === verdict ? AGREE_REWARD : DISAGREE_PENALTY)
    deltas.set(uid, (deltas.get(uid) ?? 0) + delta)
  }
  return deltas
}

// A claim was scored when it settled through a full jury with a majority.
// Claims closed as CONTESTED by expiry (fewer than 3) or a split never were.
const wasScored = (claim, list) =>
  claim.status === 'verified' && list.length >= 3 && majorityVerdict(list) !== null

async function applyReputation(deltas, verificationCounts, notifications) {
  const involved = new Set([...deltas.keys(), ...verificationCounts.keys()])
  const refs = [...involved].map((uid) => ({ uid, ref: db.doc(`users/${uid}`) }))

  await db.runTransaction(async (tx) => {
    // All reads must precede all writes inside a transaction.
    const snaps = await Promise.all(refs.map(({ ref }) => tx.get(ref)))

    refs.forEach(({ uid }, i) => {
      const snap = snaps[i]
      if (!snap.exists) return

      const updates = {}
      const count = verificationCounts.get(uid)
      if (count) updates.totalVerifications = FieldValue.increment(count)

      const delta = deltas.get(uid)
      if (delta) {
        // ponytail: clamping means an undo after hitting 0 or 100 is not exact;
        // store per-claim awards if that ever matters.
        const current = typeof snap.data().reputation === 'number' ? snap.data().reputation : 50
        updates.reputation = clamp(current + delta)
      }

      if (Object.keys(updates).length > 0) tx.update(snap.ref, updates)
    })

    for (const { ref, data } of notifications) tx.set(ref, data)
  })
}

export const awardVerificationReputation = onDocumentUpdated('claims/{claimId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!before || !after) return

  const oldList = Array.isArray(before.verifications) ? before.verifications : []
  const newList = Array.isArray(after.verifications) ? after.verifications : []

  // An admin removed a verification. Undo everything the settlement awarded;
  // if the claim reaches 3 again it is scored afresh against the new jury, so
  // nobody is paid twice.
  if (newList.length === oldList.length - 1) {
    const keptIds = new Set(newList.map((v) => v?.id))
    const removed = oldList.find((v) => !keptIds.has(v?.id))
    const deltas = wasScored(before, oldList)
      ? scoreAgainst(oldList, majorityVerdict(oldList), -1)
      : new Map()
    const counts = new Map()
    if (typeof removed?.verifierId === 'string' && removed.verifierId) counts.set(removed.verifierId, -1)
    await applyReputation(deltas, counts, [])
    return
  }

  // Otherwise only react to a single appended verification. Rules already
  // enforce exactly one append per write; anything else means an admin edit or
  // a seed run, which must not move reputation.
  if (newList.length !== oldList.length + 1) return

  const appended = newList[newList.length - 1]
  const appendedBy = appended?.verifierId
  if (typeof appendedBy !== 'string' || !appendedBy) return

  // Reputation is scored once, when the jury settles, against the majority of
  // all three — so the award does not depend on submission order. A split
  // (CONTESTED) moves nobody's reputation.
  const justSettled = before.status === 'pending' && after.status === 'verified'
  const finalVerdict = justSettled ? majorityVerdict(newList) : null
  const deltas = finalVerdict ? scoreAgainst(newList, finalVerdict) : new Map()

  // Notifications are per-user docs the client bell subscribes to. Rules only let
  // a client notify itself, so everything addressed to *other* users is written
  // here. Ids derive from the event, so an at-least-once redelivery overwrites
  // instead of duplicating.
  const claimId = event.params.claimId
  const claimText = snippet(after.text)
  const createdAt = new Date().toISOString()
  const notifications = []
  const notify = (uid, type, title, message) =>
    notifications.push({
      ref: db.doc(`notifications/${event.id}_${type}_${uid}`),
      data: { userId: uid, type, title, message, claimId, isRead: false, createdAt },
    })

  notify(appendedBy, 'verdict_submitted', 'Verdict Submitted',
    `Your ${appended.verdict} verdict on "${claimText}" was recorded into the consensus queue.`)

  if (justSettled) {
    const settledAs = finalVerdict ?? 'CONTESTED'
    const confidence = typeof after.confidenceScore === 'number' ? ` (${Math.round(after.confidenceScore)}% confidence)` : ''
    const recipients = new Set([after.submittedBy, ...newList.map((v) => v?.verifierId)])
    for (const uid of recipients) {
      if (typeof uid !== 'string' || !uid) continue
      notify(uid, 'claim_verified', `Consensus Reached: ${settledAs}`,
        `Claim "${claimText}" was settled as ${settledAs}${confidence}.`)
    }
  }

  for (const [uid, delta] of deltas) {
    notify(uid, 'reputation_update', delta > 0 ? 'Reputation Increased' : 'Reputation Decreased',
      delta > 0
        ? `+${delta} reputation for matching the consensus verdict on "${claimText}".`
        : `${delta} reputation: your verdict on "${claimText}" did not match the consensus.`)
  }

  await applyReputation(deltas, new Map([[appendedBy, 1]]), notifications)
})
