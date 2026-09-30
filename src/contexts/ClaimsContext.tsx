import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { Claim, Verification, Verdict } from '@/lib/types'
import { calculateConfidenceScore, determineSourceQuality, sourceQualityToScore } from '@/lib/confidenceScore'
import { isFirebaseConfigured, auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  addClaimToFirestore,
  updateClaimInFirestore,
  subscribeClaimsRealtime,
  flagClaimForExpeditedReview,
  getSingleClaimFromFirestore,
  deleteClaimFromFirestore,
  adminOverrideClaim,
  adminDeleteVerification,
} from '@/services/firebaseService'

const CONSENSUS_DEADLINE_DAYS = 7

interface AddClaimInput {
  text: string
  category: Claim['category']
  submittedBy: string
  /** Local display only — never persisted (claims are public). */
  submittedByName?: string
  imageUrl?: string
  thumbnailUrl?: string
  hasScreenshot?: boolean
}

interface AddVerificationInput {
  verdict: Verdict
  sourceUrl: string
  explanation: string
  verifierId: string
  verifierName: string
  verifierReputation: number
}

interface ClaimsContextValue {
  claims: Claim[]
  addClaim: (claim: AddClaimInput) => Promise<Claim>
  addVerification: (claimId: string, data: AddVerificationInput) => Promise<void>
  getClaimById: (id: string) => Claim | undefined
  getPendingClaims: () => Claim[]
  getVerifiedClaims: () => Claim[]
  expireOverdueClaims: () => Promise<void> | void
  flagClaim: (claimId: string, flagged: boolean) => Promise<void>
  deleteClaim: (claimId: string) => Promise<void>
  adminUpdateClaim: (claimId: string, updates: Partial<Claim>) => Promise<void>
  deleteVerification: (claimId: string, verificationId: string) => Promise<void>
  isLoading: boolean
  /** Set when the Firestore subscription failed; claims are empty, not stale. */
  error: Error | null
}

const defaultClaimsContext: ClaimsContextValue = {
  claims: [],
  addClaim: async (data) => ({
    ...data,
    submittedByName: data.submittedByName ?? '',
    id: `c_${Date.now()}`,
    createdAt: new Date().toISOString(),
    consensusDeadline: new Date(Date.now() + CONSENSUS_DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    verifications: [],
    verificationCount: 0,
  }),
  addVerification: async () => {},
  getClaimById: () => undefined,
  getPendingClaims: () => [],
  getVerifiedClaims: () => [],
  expireOverdueClaims: () => {},
  flagClaim: async () => {},
  deleteClaim: async () => {},
  adminUpdateClaim: async () => {},
  deleteVerification: async () => {},
  isLoading: false,
  error: null,
}

const ClaimsContext = createContext<ClaimsContextValue>(defaultClaimsContext)

let claimCounter = 0

/**
 * Pure helper that computes the fully-updated Claim after a new verification,
 * including the weighted confidence score and majority verdict. Kept outside
 * the provider so the setState updater stays pure and the logic is testable.
 */
function computeUpdatedClaim(claim: Claim, data: AddVerificationInput): Claim {
  const sourceQuality = determineSourceQuality(data.sourceUrl)

  const newVerification: Verification = {
    id: `v${Date.now()}`,
    claimId: claim.id,
    verdict: data.verdict,
    sourceUrl: data.sourceUrl,
    sourceQuality,
    explanation: data.explanation,
    verifierId: data.verifierId,
    verifierName: data.verifierName,
    verifierReputation: data.verifierReputation,
    createdAt: new Date().toISOString(),
  }

  const updatedVerifications = [...claim.verifications, newVerification]

  // Calculate new confidence score
  const verifData = updatedVerifications.map((v) => ({
    verdict: v.verdict,
    verifierReputation: v.verifierReputation,
    sourceQuality: sourceQualityToScore(v.sourceQuality),
  }))
  const confidence = calculateConfidenceScore(verifData)

  // Determine majority verdict
  const verdictCounts: Record<string, number> = {}
  updatedVerifications.forEach((v) => {
    verdictCounts[v.verdict] = (verdictCounts[v.verdict] || 0) + 1
  })
  const ranked = Object.entries(verdictCounts).sort((a, b) => b[1] - a[1])

  // A claim is 'verified' when it has at least 3 verifications
  const isVerified = updatedVerifications.length >= 3

  // A split jury has no majority. While pending the leading verdict is only a
  // preview, but a settled three-way split must be CONTESTED (firestore.rules
  // isMajorityVerdict enforces the same).
  const isSplit = ranked.length > 1 && ranked[0][1] === ranked[1][1]
  const majorityVerdict = (isVerified && isSplit ? 'CONTESTED' : ranked[0][0]) as Verdict

  return {
    ...claim,
    verifications: updatedVerifications,
    verificationCount: updatedVerifications.length,
    status: isVerified ? 'verified' : 'pending',
    // Stamp the moment consensus closed. Without this, claims verified through
    // the app had no verifiedAt at all and every "recently verified" list fell
    // back to createdAt.
    ...(isVerified ? { verifiedAt: claim.verifiedAt ?? new Date().toISOString() } : {}),
    verdict: majorityVerdict,
    confidenceScore: confidence.score,
    agreementRatio: confidence.agreementRatio,
    avgVerifierReputation: confidence.avgReputation,
    sourceQualityScore: confidence.sourceQualityScore,
  }
}

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  // Claims come from Firestore and nowhere else — there is no local mock data.
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<Error | null>(null)
  const attemptedExpiryIdsRef = useRef<Set<string>>(new Set())

  // NOTE: overdue pending claims are deliberately NOT rewritten here. Doing
  // that client-side invented a CONTESTED verdict the database never had, and
  // emptied the verification queue. The queue renders its own "Consensus
  // closed" state for them, and an admin can settle them via
  // `expireOverdueClaims`, which writes the change to Firestore.

  const localClaimsRef = useRef<Claim[]>([])
  const fetchedIdsRef = useRef<Set<string>>(new Set())

  // Realtime Firestore sync — active only when real Firebase keys are present.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    const unsub = subscribeClaimsRealtime(
      (firestoreClaims) => {
        // Firestore is the only source of truth here. An empty collection is a
        // real answer — substituting demo claims for it hid outages and made
        // every count on the dashboard wrong.
        setClaims(firestoreClaims ?? [])
        setError(null)
        setIsLoading(false)
      },
      (err) => {
        console.error('Realtime claims subscription failed:', err)
        setClaims([])
        setError(err instanceof Error ? err : new Error('Could not load claims'))
        setIsLoading(false)
      }
    )

    return () => unsub()
  }, [])

  /**
   * Mark pending claims as CONTESTED if their consensus deadline has passed
   * without reaching the minimum 3 verifications. Also mirrors the change to
   * Firestore when Firebase is configured.
   */
  const expireOverdueClaims = useCallback(() => {
    const expired: Claim[] = []
    const newExpiredToSync: Claim[] = []

    for (const claim of claims) {
      if (claim.status !== 'pending') continue
      if (claim.verificationCount >= 3) continue
      if (new Date(claim.consensusDeadline) > new Date()) continue

      let confidenceScore: number
      let agreementRatio: number
      if (claim.verifications.length > 0) {
        const verifData = claim.verifications.map((v) => ({
          verdict: v.verdict,
          verifierReputation: v.verifierReputation,
          sourceQuality: sourceQualityToScore(v.sourceQuality),
        }))
        const result = calculateConfidenceScore(verifData)
        confidenceScore = result.score
        agreementRatio = result.agreementRatio
      } else {
        confidenceScore = 30
        agreementRatio = 0
      }

      const expiredClaim: Claim = {
        ...claim,
        status: 'verified',
        verdict: 'CONTESTED',
        confidenceScore,
        agreementRatio,
        verifiedAt: new Date().toISOString(),
      }

      expired.push(expiredClaim)
      if (!attemptedExpiryIdsRef.current.has(claim.id)) {
        attemptedExpiryIdsRef.current.add(claim.id)
        newExpiredToSync.push(expiredClaim)
      }
    }

    if (expired.length === 0) return

    setClaims((prev) =>
      prev.map((c) => expired.find((e) => e.id === c.id) ?? c)
    )

    if (isFirebaseConfigured && auth.currentUser && newExpiredToSync.length > 0) {
      // Report the outcome so the admin console can say how many claims were
      // actually settled instead of always claiming success.
      return Promise.allSettled(newExpiredToSync.map((c) => updateClaimInFirestore(c))).then(
        (results) => {
          const failed = results.filter((r) => r.status === 'rejected').length
          if (failed > 0) {
            // Re-arm the ids so a retry is possible.
            newExpiredToSync.forEach((c) => attemptedExpiryIdsRef.current.delete(c.id))
            throw new Error(`${failed} of ${newExpiredToSync.length} claims could not be settled.`)
          }
        }
      )
    }
  }, [claims])

  const addClaim = useCallback(async (data: AddClaimInput): Promise<Claim> => {
    claimCounter++
    const deadlineMs = Date.now() + CONSENSUS_DEADLINE_DAYS * 24 * 60 * 60 * 1000
    const newClaim: Claim = {
      ...data,
      submittedByName: data.submittedByName ?? '',
      id: `c${claimCounter}`,
      createdAt: new Date().toISOString(),
      consensusDeadline: new Date(deadlineMs).toISOString(),
      // Firestore rules check this numeric copy, not the ISO string — see the
      // claims create/Case B rules in firestore.rules.
      consensusDeadlineMs: deadlineMs,
      status: 'pending',
      verifications: [],
      verificationCount: 0,
    }

    // Track in localClaimsRef so realtime snapshots never overwrite this new claim
    localClaimsRef.current = [newClaim, ...localClaimsRef.current.filter((c) => c.id !== newClaim.id)]

    if (isFirebaseConfigured) {
      try {
        // Strip the temporary local id so the Firestore doc never stores an
        // `id` field that could shadow the real document id on read-back.
        const { id: _tempId, ...claimData } = newClaim
        const id = await addClaimToFirestore(claimData)
        const persisted: Claim = { ...newClaim, id }
        localClaimsRef.current = [persisted, ...localClaimsRef.current.filter((c) => c.id !== persisted.id && c.id !== newClaim.id)]
        // Dedupe defensively: the realtime listener may already have delivered
        // this claim before the write resolves, so never prepend a duplicate.
        setClaims((prev) => [persisted, ...prev.filter((c) => c.id !== persisted.id && c.id !== newClaim.id)])
        return persisted
      } catch (err) {
        // Previously this swallowed the error and returned the local claim with
        // a made-up id, so Submit showed a success modal linking to a claim that
        // did not exist. Let the caller surface the failure instead.
        localClaimsRef.current = localClaimsRef.current.filter((c) => c.id !== newClaim.id)
        throw err
      }
    }

    setClaims((prev) => [newClaim, ...prev.filter((c) => c.id !== newClaim.id)])
    return newClaim
  }, [])

  const addVerification = useCallback(
    async (claimId: string, data: AddVerificationInput): Promise<void> => {
      const target = claims.find((c) => c.id === claimId)
      if (!target) throw new Error('That claim no longer exists.')

      const updatedClaim = computeUpdatedClaim(target, data)

      localClaimsRef.current = [
        updatedClaim,
        ...localClaimsRef.current.filter((c) => c.id !== claimId),
      ]

      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? updatedClaim : c))
      )

      if (isFirebaseConfigured) {
        try {
          // This used to be fire-and-forget with a console.warn. A verdict the
          // rules rejected still showed "recorded successfully" and vanished on
          // the next reload, so the write result now decides what the UI says.
          await updateClaimInFirestore(updatedClaim)
        } catch (err) {
          // Roll the optimistic update back so the UI matches the database.
          localClaimsRef.current = [
            target,
            ...localClaimsRef.current.filter((c) => c.id !== claimId),
          ]
          setClaims((prev) => prev.map((c) => (c.id === claimId ? target : c)))
          throw err
        }
      }

      // Reputation and totalVerifications are deliberately NOT written here.
      // firestore.rules denies every client write to those fields, so this call
      // was rejected on every single verification by a normal user — the local
      // state showed a reputation gain that never persisted and vanished on
      // reload. The awardVerificationReputation Cloud Function (functions/index.js)
      // is now the only writer; its update arrives through the profile snapshot.
    },
    [claims, user]
  )

  /**
   * Admin action: flag / unflag a claim for expedited review. Optimistically
   * updates local state, then persists to Firestore (rules enforce admin-only).
   */
  const flagClaim = useCallback(
    async (claimId: string, flagged: boolean) => {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? { ...c, adminFlagged: flagged, adminFlaggedAt: flagged ? new Date().toISOString() : undefined }
            : c
        )
      )
      if (isFirebaseConfigured) {
        await flagClaimForExpeditedReview(claimId, flagged)
      }
    },
    []
  )

  /**
   * Admin action: hard delete a claim from local state and Firestore
   */
  const deleteClaim = useCallback(
    async (claimId: string) => {
      localClaimsRef.current = localClaimsRef.current.filter((c) => c.id !== claimId)
      setClaims((prev) => prev.filter((c) => c.id !== claimId))
      if (isFirebaseConfigured) {
        await deleteClaimFromFirestore(claimId)
      }
    },
    []
  )

  /**
   * Admin action: override / update claim fields directly (verdict, category, text, status, etc.)
   */
  const adminUpdateClaim = useCallback(
    async (claimId: string, updates: Partial<Claim>) => {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, ...updates } : c))
      )
      localClaimsRef.current = localClaimsRef.current.map((c) =>
        c.id === claimId ? { ...c, ...updates } : c
      )
      if (isFirebaseConfigured) {
        await adminOverrideClaim(claimId, updates)
      }
    },
    []
  )

  /**
   * Admin action: delete a specific verification from a claim
   */
  const deleteVerification = useCallback(
    async (claimId: string, verificationId: string) => {
      setClaims((prev) =>
        prev.map((c) => {
          if (c.id !== claimId) return c
          const updatedVerifs = c.verifications.filter((v) => v.id !== verificationId)
          const isVerified = updatedVerifs.length >= 3
          return {
            ...c,
            verifications: updatedVerifs,
            verificationCount: updatedVerifs.length,
            status: isVerified ? 'verified' : 'pending',
            // Mirrors adminDeleteVerification: a reopened claim loses its verdict.
            ...(isVerified
              ? {}
              : {
                  verdict: undefined,
                  confidenceScore: undefined,
                  agreementRatio: undefined,
                  avgVerifierReputation: undefined,
                  sourceQualityScore: undefined,
                  verifiedAt: undefined,
                }),
          }
        })
      )
      if (isFirebaseConfigured) {
        await adminDeleteVerification(claimId, verificationId)
      }
    },
    []
  )

  // NOTE: These getters are called during render (e.g. ClaimDetail), so they
  // MUST stay side-effect free. Expiry is handled exclusively by the mount +
  // interval effects above — never synchronously inside a getter.
  const getClaimById = useCallback(
    (id: string) => {
      const existing = claims.find((c) => c.id === id)
      if (existing) return existing

      // Claims outside the realtime window are fetched once each. This ran on
      // every render while the claim was missing — and forever for a bad id.
      if (isFirebaseConfigured && id && !fetchedIdsRef.current.has(id)) {
        fetchedIdsRef.current.add(id)
        getSingleClaimFromFirestore(id).then((fetched) => {
          if (fetched) {
            localClaimsRef.current = [fetched, ...localClaimsRef.current.filter((c) => c.id !== fetched.id)]
            setClaims((prev) => [fetched, ...prev.filter((c) => c.id !== fetched.id)])
          }
        })
      }
      return undefined
    },
    [claims]
  )

  const getPendingClaims = useCallback(
    () => claims.filter((c) => c.status === 'pending'),
    [claims]
  )

  const getVerifiedClaims = useCallback(
    () => claims.filter((c) => c.status === 'verified'),
    [claims]
  )

  return (
    <ClaimsContext.Provider
      value={{
        claims,
        addClaim,
        addVerification,
        getClaimById,
        getPendingClaims,
        getVerifiedClaims,
        expireOverdueClaims,
        flagClaim,
        deleteClaim,
        adminUpdateClaim,
        deleteVerification,
        isLoading,
        error,
      }}
    >
      {children}
    </ClaimsContext.Provider>
  )
}

export function useClaims() {
  const context = useContext(ClaimsContext)
  return context || defaultClaimsContext
}
