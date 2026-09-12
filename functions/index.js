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

export const awardVerificationReputation = onDocumentUpdated('claims/{claimId}', async (event) => {
  const before = event.data?.before.data()
  const after = event.data?.after.data()
  if (!before || !after) return

  const oldList = Array.isArray(before.verifications) ? before.verifications : []
  const newList = Array.isArray(after.verifications) ? after.verifications : []

  // Only react to a single appended verification. Rules already enforce exactly
  // one append per write; anything else means an admin edit or a seed run, which
  // must not move reputation.
  if (newList.length !== oldList.length + 1) return

  const appended = newList[newList.length - 1]
  const appendedBy = appended?.verifierId
  if (typeof appendedBy !== 'string' || !appendedBy) return

  // Reputation is scored against a settled verdict, never the running majority
  // the client shows mid-flight.
  const justSettled = before.status === 'pending' && after.status === 'verified'
  const alreadySettled = before.status === 'verified'
  const finalVerdict = after.verdict

  // uid -> reputation delta. Everyone who took part is scored against the final
  // verdict when consensus lands, so the award does not depend on submission
  // order; a late verification on an already-settled claim scores only itself.
  const deltas = new Map()
  if (finalVerdict) {
    const scored = justSettled ? newList : alreadySettled ? [appended] : []
    for (const v of scored) {
      const uid = v?.verifierId
      if (typeof uid !== 'string' || !uid) continue
      const delta = v.verdict === finalVerdict ? AGREE_REWARD : DISAGREE_PENALTY
      deltas.set(uid, (deltas.get(uid) ?? 0) + delta)
    }
  }

  const involved = new Set([appendedBy, ...deltas.keys()])
  const refs = [...involved].map((uid) => ({ uid, ref: db.doc(`users/${uid}`) }))

  await db.runTransaction(async (tx) => {
    // All reads must precede all writes inside a transaction.
    const snaps = await Promise.all(refs.map(({ ref }) => tx.get(ref)))

    refs.forEach(({ uid }, i) => {
      const snap = snaps[i]
      if (!snap.exists) return

      const updates = {}
      if (uid === appendedBy) updates.totalVerifications = FieldValue.increment(1)

      const delta = deltas.get(uid)
      if (delta) {
        const current = typeof snap.data().reputation === 'number' ? snap.data().reputation : 50
        updates.reputation = clamp(current + delta)
      }

      if (Object.keys(updates).length > 0) tx.update(snap.ref, updates)
    })
  })
})
