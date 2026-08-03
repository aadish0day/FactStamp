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

const SEED_CLAIMS: Claim[] = [
  {
    id: 'c_seed_1',
    text: 'Drinking boiled ginger water with lemon twice daily permanently cures Type 2 Diabetes within 14 days.',
    category: 'health',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u101',
    submittedByName: 'Priya Sharma',
    verificationCount: 2,
    adminFlagged: true,
    adminFlaggedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verifications: [
      {
        id: 'v_seed_1a',
        claimId: 'c_seed_1',
        verdict: 'FALSE',
        sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/diabetes',
        sourceQuality: 'high',
        explanation: 'Clinical evidence shows ginger cannot cure diabetes or reverse pancreatic beta-cell dysfunction in 14 days.',
        verifierId: 'u_dr_anita',
        verifierName: 'Dr. Anita Verma',
        verifierReputation: 94,
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'v_seed_1b',
        claimId: 'c_seed_1',
        verdict: 'FALSE',
        sourceUrl: 'https://www.diabetes.org/nutrition/ginger-claims',
        sourceQuality: 'medium',
        explanation: 'The American Diabetes Association explicitly disproves herbal remedies as standalone cures for Type 2 diabetes.',
        verifierId: 'u_rajesh_k',
        verifierName: 'Rajesh Kumar',
        verifierReputation: 82,
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 18,
    agreementRatio: 1.0,
    avgVerifierReputation: 88,
    sourceQualityScore: 90,
  },
  {
    id: 'c_seed_2',
    text: 'RBI is introducing an 18% digital transaction tax on all UPI payments exceeding ₹5,000 starting next month.',
    category: 'financial',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u102',
    submittedByName: 'Vikram Patel',
    verificationCount: 1,
    adminFlagged: true,
    adminFlaggedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    verifications: [
      {
        id: 'v_seed_2a',
        claimId: 'c_seed_2',
        verdict: 'FALSE',
        sourceUrl: 'https://pib.gov.in/factcheck/upi-tax-rumor',
        sourceQuality: 'high',
        explanation: 'PIB Fact Check confirmed no UPI digital transaction tax has been approved or proposed by RBI or Finance Ministry.',
        verifierId: 'u_sunil_m',
        verifierName: 'Sunil Mehta',
        verifierReputation: 88,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 25,
    agreementRatio: 1.0,
    avgVerifierReputation: 88,
    sourceQualityScore: 95,
  },
  {
    id: 'c_seed_3',
    text: 'A massive G5 solar storm will disconnect global GPS navigation and cell tower communications for 72 hours.',
    category: 'other',
    status: 'pending',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u103',
    submittedByName: 'Amit Roy',
    verificationCount: 1,
    verifications: [
      {
        id: 'v_seed_3a',
        claimId: 'c_seed_3',
        verdict: 'MISLEADING',
        sourceUrl: 'https://www.swpc.noaa.gov/space-weather-alerts',
        sourceQuality: 'high',
        explanation: 'NOAA Space Weather Prediction Center issued a moderate G2 geomagnetic storm watch, which causes minor HF radio degradation, not global 72-hour blackouts.',
        verifierId: 'u_dr_seshadri',
        verifierName: 'Dr. K. Seshadri',
        verifierReputation: 91,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 42,
    agreementRatio: 1.0,
    avgVerifierReputation: 91,
    sourceQualityScore: 95,
  },
  {
    id: 'c_seed_4',
    text: 'UNESCO official board voted the Indian National Anthem as the single best national anthem in the world for 2026.',
    category: 'political',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u104',
    submittedByName: 'Kavita Reddy',
    verificationCount: 0,
    verifications: [],
  },
  {
    id: 'c_seed_5',
    text: 'Drinking raw organic turmeric mixed into warm milk at bedtime eliminates all cholesterol plaques in coronary arteries.',
    category: 'health',
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u105',
    submittedByName: 'Ramesh Gupta',
    verificationCount: 2,
    verifications: [
      {
        id: 'v_seed_5a',
        claimId: 'c_seed_5',
        verdict: 'MISLEADING',
        sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5664031/',
        sourceQuality: 'high',
        explanation: 'Curcumin has mild anti-inflammatory properties, but does not dissolve calcified arterial plaque in human coronary arteries.',
        verifierId: 'u_meera_j',
        verifierName: 'Dr. Meera Joshi',
        verifierReputation: 89,
        createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'v_seed_5b',
        claimId: 'c_seed_5',
        verdict: 'FALSE',
        sourceUrl: 'https://www.cardiology.org/turmeric-myths',
        sourceQuality: 'high',
        explanation: 'Arterial plaque regression requires statin therapy or lifestyle intervention under medical supervision.',
        verifierId: 'u_alok_n',
        verifierName: 'Dr. Alok Nath',
        verifierReputation: 93,
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 28,
    agreementRatio: 0.5,
    avgVerifierReputation: 91,
    sourceQualityScore: 90,
  },
  {
    id: 'c_seed_6',
    text: 'Central Government to deposit ₹2,000 monthly digital stipend into bank accounts of all registered college students.',
    category: 'financial',
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u106',
    submittedByName: 'Suresh Nair',
    verificationCount: 1,
    adminFlagged: true,
    adminFlaggedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    verifications: [
      {
        id: 'v_seed_6a',
        claimId: 'c_seed_6',
        verdict: 'FALSE',
        sourceUrl: 'https://pib.gov.in/factcheck/student-stipend-scheme',
        sourceQuality: 'high',
        explanation: 'Ministry of Education confirmed no ₹2,000 monthly universal student stipend scheme exists or has been announced.',
        verifierId: 'u_pooja_d',
        verifierName: 'Pooja Deshmukh',
        verifierReputation: 85,
        createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 22,
    agreementRatio: 1.0,
    avgVerifierReputation: 85,
    sourceQualityScore: 95,
  },
  {
    id: 'c_seed_7',
    text: 'New archaeological excavations in Gujarat uncovered 4,500-year-old copper battery cells used for electroplating.',
    category: 'other',
    status: 'pending',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u107',
    submittedByName: 'Deepak Sen',
    verificationCount: 0,
    verifications: [],
  },
  {
    id: 'c_seed_8',
    text: 'High-frequency 5G cell towers cause stainless steel kitchen utensils to develop temporary magnetic polarization.',
    category: 'other',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u108',
    submittedByName: 'Ananya Das',
    verificationCount: 2,
    verifications: [
      {
        id: 'v_seed_8a',
        claimId: 'c_seed_8',
        verdict: 'FALSE',
        sourceUrl: 'https://www.fcc.gov/5g-radio-frequency-safety',
        sourceQuality: 'high',
        explanation: 'RF electromagnetic fields from 5G operate at non-ionizing frequencies that cannot induce static magnetic forces in metals.',
        verifierId: 'u_rohan_v',
        verifierName: 'Rohan Varma',
        verifierReputation: 87,
        createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'v_seed_8b',
        claimId: 'c_seed_8',
        verdict: 'FALSE',
        sourceUrl: 'https://www.physics.org/em-fields-and-metals',
        sourceQuality: 'high',
        explanation: 'Austenitic stainless steel is non-magnetic; RF signals do not magnetize household cookware.',
        verifierId: 'u_swati_p',
        verifierName: 'Swati Pillai',
        verifierReputation: 90,
        createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 15,
    agreementRatio: 1.0,
    avgVerifierReputation: 89,
    sourceQualityScore: 92,
  },
  {
    id: 'c_seed_9',
    text: 'Sprinkling sea salt at the main entrance doorway during a solar eclipse neutralizes harmful planetary radiation.',
    category: 'religious',
    status: 'pending',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u109',
    submittedByName: 'Bhakti Vedant',
    verificationCount: 0,
    verifications: [],
  },
  {
    id: 'c_seed_10',
    text: 'WHO issues global health warning stating zero-calorie artificial sweeteners double memory loss risks within 6 months.',
    category: 'health',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u110',
    submittedByName: 'Neha Trivedi',
    verificationCount: 1,
    verifications: [
      {
        id: 'v_seed_10a',
        claimId: 'c_seed_10',
        verdict: 'MISLEADING',
        sourceUrl: 'https://www.who.int/news/item/non-sugar-sweeteners-guidelines',
        sourceQuality: 'medium',
        explanation: 'WHO guidelines advise against non-sugar sweeteners for long-term weight control, but issued no memory loss warning.',
        verifierId: 'u_dr_sanjay',
        verifierName: 'Dr. Sanjay Rao',
        verifierReputation: 92,
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 40,
    agreementRatio: 1.0,
    avgVerifierReputation: 92,
    sourceQualityScore: 85,
  },
  {
    id: 'c_seed_11',
    text: 'Reserve Bank orders all commercial banks to completely waive home loan interest payments for senior citizens over 70.',
    category: 'financial',
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u111',
    submittedByName: 'Manoj Kulkarni',
    verificationCount: 0,
    verifications: [],
  },
  {
    id: 'c_seed_12',
    text: 'New election mandate requires mandatory Voter ID card verification before registering any new social media account.',
    category: 'political',
    status: 'pending',
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    consensusDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: 'u112',
    submittedByName: 'Ritu Bannerjee',
    verificationCount: 1,
    verifications: [
      {
        id: 'v_seed_12a',
        claimId: 'c_seed_12',
        verdict: 'FALSE',
        sourceUrl: 'https://pib.gov.in/factcheck/social-media-voterid',
        sourceQuality: 'high',
        explanation: 'Election Commission and IT Ministry disowned the viral notification; no Voter ID rule exists for social media.',
        verifierId: 'u_aakash_b',
        verifierName: 'Aakash Bose',
        verifierReputation: 86,
        createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
      },
    ],
    confidenceScore: 24,
    agreementRatio: 1.0,
    avgVerifierReputation: 86,
    sourceQualityScore: 95,
  },
]

export function ClaimsProvider({ children }: { children: ReactNode }) {
  // The claims collection is initialized with rich seed data and updated via Firestore
  const [claims, setClaims] = useState<Claim[]>(SEED_CLAIMS)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)
  const expiryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const attemptedExpiryIdsRef = useRef<Set<string>>(new Set())

  // Helper to map overdue pending claims to verified/CONTESTED in-memory
  const applyLocalExpiry = useCallback((claimsList: Claim[]): Claim[] => {
    const now = new Date()
    return claimsList.map((claim) => {
      if (
        claim.status === 'pending' &&
        claim.verificationCount < 3 &&
        new Date(claim.consensusDeadline) <= now
      ) {
        let confidenceScore = 30
        let agreementRatio = 0
        if (claim.verifications && claim.verifications.length > 0) {
          const verifData = claim.verifications.map((v) => ({
            verdict: v.verdict,
            verifierReputation: v.verifierReputation,
            sourceQuality: sourceQualityToScore(v.sourceQuality),
          }))
          const result = calculateConfidenceScore(verifData)
          confidenceScore = result.score
          agreementRatio = result.agreementRatio
        }
        return {
          ...claim,
          status: 'verified',
          verdict: 'CONTESTED',
          confidenceScore,
          agreementRatio,
          verifiedAt: claim.verifiedAt || new Date().toISOString(),
        }
      }
      return claim
    })
  }, [])

  // Realtime Firestore sync — active only when real Firebase keys are present.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    const unsub = subscribeClaimsRealtime(
      (firestoreClaims) => {
        const firestoreIds = new Set(firestoreClaims.map((c) => c.id))
        const remainingSeeds = SEED_CLAIMS.filter((s) => !firestoreIds.has(s.id))
        const merged = applyLocalExpiry([...firestoreClaims, ...remainingSeeds])
        setClaims(merged)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )

    return () => unsub()
  }, [applyLocalExpiry])

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
      newExpiredToSync.forEach((c) => {
        updateClaimInFirestore(c).catch(() => {})
      })
    }
  }, [claims])

  // Periodic expiry check every 60 seconds
  useEffect(() => {
    expiryIntervalRef.current = setInterval(() => {
      expireOverdueClaims()
    }, 60_000)
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
