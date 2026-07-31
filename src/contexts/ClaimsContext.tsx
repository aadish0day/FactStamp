import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import type { Claim, Verification, Verdict } from '@/lib/types'
import { calculateConfidenceScore, determineSourceQuality, sourceQualityToScore } from '@/lib/confidenceScore'
import { isFirebaseConfigured, auth } from '@/lib/firebase'
import {
  addClaimToFirestore,
  updateClaimInFirestore,
  subscribeClaimsRealtime,
  flagClaimForExpeditedReview,
} from '@/services/firebaseService'

const CONSENSUS_DEADLINE_DAYS = 7

interface AddClaimInput {
  text: string
  category: Claim['category']
  submittedBy: string
  submittedByName: string
  imageUrl?: string
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
  addVerification: (claimId: string, data: AddVerificationInput) => void
  getClaimById: (id: string) => Claim | undefined
  getPendingClaims: () => Claim[]
  getVerifiedClaims: () => Claim[]
  expireOverdueClaims: () => void
  flagClaim: (claimId: string, flagged: boolean) => Promise<void>
  isLoading: boolean
}

const defaultClaimsContext: ClaimsContextValue = {
  claims: [],
  addClaim: async (data) => ({
    ...data,
    id: `c_${Date.now()}`,
    createdAt: new Date().toISOString(),
    consensusDeadline: new Date(Date.now() + CONSENSUS_DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    verifications: [],
    verificationCount: 0,
  }),
  addVerification: () => {},
  getClaimById: () => undefined,
  getPendingClaims: () => [],
  getVerifiedClaims: () => [],
  expireOverdueClaims: () => {},
  flagClaim: async () => {},
  isLoading: false,
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
  const majorityVerdict = Object.entries(verdictCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as Verdict

  // A claim is 'verified' when it has at least 3 verifications
  const isVerified = updatedVerifications.length >= 3

  return {
    ...claim,
    verifications: updatedVerifications,
    verificationCount: updatedVerifications.length,
    status: isVerified ? 'verified' : 'pending',
    verdict: majorityVerdict,
    confidenceScore: confidence.score,
    agreementRatio: confidence.agreementRatio,
    avgVerifierReputation: confidence.avgReputation,
    sourceQualityScore: confidence.sourceQualityScore,
  }
}

export function ClaimsProvider({ children }: { children: ReactNode }) {
  // The claims collection is the single source of truth — always fetched from
  // Firestore via the realtime subscription. There is no in-memory seed data.
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)
  const expiryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Realtime Firestore sync — active only when real Firebase keys are present.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    // onSnapshot returns the unsubscribe synchronously; runtime failures arrive
    // via the error callback below (which clears loading state), so no try/catch
    // is needed here.
    const unsub = subscribeClaimsRealtime(
      (firestoreClaims) => {
        setClaims(firestoreClaims)
        setIsLoading(false)
      },
      () => setIsLoading(false)
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
        // No verifications at all — default low score
        confidenceScore = 30
        agreementRatio = 0
      }

      expired.push({
        ...claim,
        status: 'verified',
        verdict: 'CONTESTED',
        confidenceScore,
        agreementRatio,
        verifiedAt: new Date().toISOString(),
      })
    }

    if (expired.length === 0) return

    setClaims((prev) =>
      prev.map((c) => expired.find((e) => e.id === c.id) ?? c)
    )

    if (isFirebaseConfigured && auth.currentUser) {
      expired.forEach((c) => {
        updateClaimInFirestore(c).catch(() => {})
      })
    }
  }, [claims])

  // Run expiry check on mount
  useEffect(() => {
    expireOverdueClaims()
  }, [expireOverdueClaims])

  // Periodic expiry check every 60 seconds
  useEffect(() => {
    expiryIntervalRef.current = setInterval(expireOverdueClaims, 60_000)
    return () => {
      if (expiryIntervalRef.current) clearInterval(expiryIntervalRef.current)
    }
  }, [expireOverdueClaims])

  const addClaim = useCallback(async (data: AddClaimInput): Promise<Claim> => {
    claimCounter++
    const newClaim: Claim = {
      ...data,
      id: `c${claimCounter}`,
      createdAt: new Date().toISOString(),
      consensusDeadline: new Date(Date.now() + CONSENSUS_DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      verifications: [],
      verificationCount: 0,
    }

    if (isFirebaseConfigured) {
      try {
        // Strip the temporary local id so the Firestore doc never stores an
        // `id` field that could shadow the real document id on read-back.
        const { id: _tempId, ...claimData } = newClaim
        const id = await addClaimToFirestore(claimData)
        const persisted: Claim = { ...newClaim, id }
        // Dedupe defensively: the realtime listener may already have delivered
        // this claim before the write resolves, so never prepend a duplicate.
        setClaims((prev) => [persisted, ...prev.filter((c) => c.id !== persisted.id)])
        return persisted
      } catch (err) {
        console.warn('Firestore add notice (using local state):', err)
        setClaims((prev) => [newClaim, ...prev])
        return newClaim
      }
    }

    setClaims((prev) => [newClaim, ...prev])
    return newClaim
  }, [])

  const addVerification = useCallback(
    (claimId: string, data: AddVerificationInput) => {
      const target = claims.find((c) => c.id === claimId)
      if (!target) return

      const updatedClaim = computeUpdatedClaim(target, data)

      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? updatedClaim : c))
      )

      if (isFirebaseConfigured) {
        updateClaimInFirestore(updatedClaim).catch((err) =>
          console.warn('Firestore verdict sync notice:', err)
        )
      }
    },
    [claims]
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
        try {
          await flagClaimForExpeditedReview(claimId, flagged)
        } catch (err) {
          console.warn('Firestore flag sync notice:', err)
        }
      }
    },
    []
  )

  // NOTE: These getters are called during render (e.g. ClaimDetail), so they
  // MUST stay side-effect free. Expiry is handled exclusively by the mount +
  // interval effects above — never synchronously inside a getter.
  const getClaimById = useCallback(
    (id: string) => claims.find((c) => c.id === id),
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
      value={{ claims, addClaim, addVerification, getClaimById, getPendingClaims, getVerifiedClaims, expireOverdueClaims, flagClaim, isLoading }}
    >
      {children}
    </ClaimsContext.Provider>
  )
}

export function useClaims() {
  const context = useContext(ClaimsContext)
  return context || defaultClaimsContext
}
