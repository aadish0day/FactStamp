import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { MOCK_CLAIMS, type Claim, type Verification, type Verdict } from '@/lib/types'
import { calculateConfidenceScore, determineSourceQuality, sourceQualityToScore } from '@/lib/confidenceScore'

const CONSENSUS_DEADLINE_DAYS = 7

interface ClaimsContextValue {
  claims: Claim[]
  addClaim: (claim: Omit<Claim, 'id' | 'createdAt' | 'consensusDeadline' | 'verificationCount' | 'verifications' | 'status'>) => Claim
  addVerification: (
    claimId: string,
    data: { verdict: Verdict; sourceUrl: string; explanation: string; verifierId: string; verifierName: string; verifierReputation: number }
  ) => void
  getClaimById: (id: string) => Claim | undefined
  getPendingClaims: () => Claim[]
  getVerifiedClaims: () => Claim[]
  expireOverdueClaims: () => void
  isLoading: boolean
}

const defaultClaimsContext: ClaimsContextValue = {
  claims: MOCK_CLAIMS,
  addClaim: (data) => ({
    ...data,
    id: `c_${Date.now()}`,
    createdAt: new Date().toISOString(),
    consensusDeadline: new Date(Date.now() + CONSENSUS_DEADLINE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    verifications: [],
    verificationCount: 0,
  }),
  addVerification: () => {},
  getClaimById: (id: string) => MOCK_CLAIMS.find((c) => c.id === id),
  getPendingClaims: () => MOCK_CLAIMS.filter((c) => c.status === 'pending'),
  getVerifiedClaims: () => MOCK_CLAIMS.filter((c) => c.status === 'verified'),
  expireOverdueClaims: () => {},
  isLoading: false,
}

const ClaimsContext = createContext<ClaimsContextValue>(defaultClaimsContext)

let claimCounter = MOCK_CLAIMS.length

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS)
  const [isLoading, setIsLoading] = useState(false)
  const expiryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Mark pending claims as CONTESTED if their consensus deadline has passed
   * without reaching the minimum 3 verifications.
   */
  const expireOverdueClaims = useCallback(() => {
    setClaims((prev) => {
      let changed = false
      const next = prev.map((claim) => {
        if (claim.status !== 'pending') return claim
        if (claim.verificationCount >= 3) return claim
        if (new Date(claim.consensusDeadline) > new Date()) return claim

        // Use the existing confidence score calculator if there are verifications
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

        changed = true
        return {
          ...claim,
          status: 'verified' as const,
          verdict: 'CONTESTED' as const,
          confidenceScore,
          agreementRatio,
          verifiedAt: new Date().toISOString(),
        }
      })
      // Bail out with the same reference if nothing expired, so consumers
      // don't re-render on every interval tick for no reason.
      return changed ? next : prev
    })
  }, [])

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

  const addClaim = useCallback((data: Omit<Claim, 'id' | 'createdAt' | 'consensusDeadline' | 'verificationCount' | 'verifications' | 'status'>) => {
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
    setClaims((prev) => [newClaim, ...prev])
    return newClaim
  }, [])

  const addVerification = useCallback(
    (
      claimId: string,
      data: { verdict: Verdict; sourceUrl: string; explanation: string; verifierId: string; verifierName: string; verifierReputation: number }
    ) => {
      setClaims((prev) =>
        prev.map((claim) => {
          if (claim.id !== claimId) return claim

          const sourceQuality = determineSourceQuality(data.sourceUrl)

          const newVerification: Verification = {
            id: `v${Date.now()}`,
            claimId,
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
            status: isVerified ? 'verified' : ('pending' as 'pending' | 'verified'),
            verdict: majorityVerdict,
            confidenceScore: confidence.score,
            agreementRatio: confidence.agreementRatio,
            avgVerifierReputation: confidence.avgReputation,
            sourceQualityScore: confidence.sourceQualityScore,
          }
        })
      )
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
      value={{ claims, addClaim, addVerification, getClaimById, getPendingClaims, getVerifiedClaims, expireOverdueClaims, isLoading }}
    >
      {children}
    </ClaimsContext.Provider>
  )
}

export function useClaims() {
  const context = useContext(ClaimsContext)
  return context || defaultClaimsContext
}
