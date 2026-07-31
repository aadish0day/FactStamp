/* ── Enums & Types ── */

export type Verdict = 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE' | 'CONTESTED'

export type ClaimStatus = 'pending' | 'verified'

export type ClaimCategory = 'health' | 'political' | 'religious' | 'financial' | 'other'

export type SourceQuality = 'high' | 'medium' | 'low'

export interface User {
  uid: string
  displayName: string
  email: string
  avatarUrl?: string
  reputation: number
  totalVerifications: number
  joinedAt: string
}

export interface Claim {
  id: string
  text: string
  category: ClaimCategory
  status: ClaimStatus
  createdAt: string
  verifiedAt?: string
  consensusDeadline: string
  submittedBy: string
  submittedByName: string
  verdict?: Verdict
  confidenceScore?: number
  verifications: Verification[]
  verificationCount: number
  agreementRatio?: number
  avgVerifierReputation?: number
  sourceQualityScore?: number
}

export interface Verification {
  id: string
  claimId: string
  verdict: Verdict
  sourceUrl: string
  sourceQuality: SourceQuality
  explanation: string
  verifierId: string
  verifierName: string
  verifierReputation: number
  createdAt: string
}

export interface TrendingWeek {
  totalClaims: number
  verifiedClaims: number
  falseClaims: number
  avgConfidence: number
  activeVerifiers: number
  weekStart: string
}

export interface VerifierLeaderboardEntry {
  uid: string
  name: string
  reputation: number
  verifications: number
}

/* ── Verdict Meta ── */

export const VERDICT_META: Record<Verdict, {
  label: string
  colorVar: string
  bgVar: string
  borderVar: string
  thudColor: string
  hexColor: string
  hexBg: string
  hexBorder: string
}> = {
  TRUE: {
    label: 'True',
    colorVar: '--color-v-true',
    bgVar: '--color-v-true-bg',
    borderVar: '--color-v-true-border',
    thudColor: 'rgba(42, 157, 100, 0.15)',
    hexColor: '#16a34a',
    hexBg: '#f0fdf4',
    hexBorder: '#bbf7d0',
  },
  FALSE: {
    label: 'False',
    colorVar: '--color-v-false',
    bgVar: '--color-v-false-bg',
    borderVar: '--color-v-false-border',
    thudColor: 'rgba(215, 55, 55, 0.15)',
    hexColor: '#dc2626',
    hexBg: '#fef2f2',
    hexBorder: '#fecaca',
  },
  MISLEADING: {
    label: 'Misleading',
    colorVar: '--color-v-mislead',
    bgVar: '--color-v-mislead-bg',
    borderVar: '--color-v-mislead-border',
    thudColor: 'rgba(210, 130, 20, 0.15)',
    hexColor: '#d97706',
    hexBg: '#fffbeb',
    hexBorder: '#fef3c7',
  },
  UNVERIFIABLE: {
    label: 'Unverifiable',
    colorVar: '--color-v-unverif',
    bgVar: '--color-v-unverif-bg',
    borderVar: '--color-v-unverif-border',
    thudColor: 'rgba(100, 120, 140, 0.12)',
    hexColor: '#475569',
    hexBg: '#f8fafc',
    hexBorder: '#e2e8f0',
  },
  CONTESTED: {
    label: 'Contested',
    colorVar: '--color-v-contested',
    bgVar: '--color-v-contested-bg',
    borderVar: '--color-v-contested-border',
    thudColor: 'rgba(60, 110, 210, 0.15)',
    hexColor: '#2563eb',
    hexBg: '#eff6ff',
    hexBorder: '#bfdbfe',
  },
}

/* ── Mock Data ── */

export const MOCK_USERS: User[] = [
  {
    uid: 'u1',
    displayName: 'Priya Sharma',
    email: 'priya@example.com',
    reputation: 87,
    totalVerifications: 42,
    joinedAt: '2025-01-15T08:00:00Z',
  },
  {
    uid: 'u2',
    displayName: 'Raj Patel',
    email: 'raj@example.com',
    reputation: 94,
    totalVerifications: 78,
    joinedAt: '2024-11-03T10:30:00Z',
  },
  {
    uid: 'u3',
    displayName: 'Ananya Gupta',
    email: 'ananya@example.com',
    reputation: 72,
    totalVerifications: 23,
    joinedAt: '2025-03-20T14:00:00Z',
  },
  {
    uid: 'u4',
    displayName: 'Vikram Singh',
    email: 'vikram@example.com',
    reputation: 91,
    totalVerifications: 65,
    joinedAt: '2024-09-12T06:45:00Z',
  },
  {
    uid: 'u5',
    displayName: 'Neha Joshi',
    email: 'neha@example.com',
    reputation: 68,
    totalVerifications: 15,
    joinedAt: '2025-05-01T12:00:00Z',
  },
]

export const MOCK_VERIFICATIONS: Verification[] = [
  {
    id: 'v1',
    claimId: 'c1',
    verdict: 'FALSE',
    sourceUrl: 'https://who.int/dengue-treatment-guidelines',
    sourceQuality: 'high',
    explanation:
      "WHO guidelines clearly state no specific treatment exists for dengue. Paracetamol is recommended for fever management, not antibiotics which are ineffective against viral infections. The 'neem leaf cure' has no peer-reviewed evidence.",
    verifierId: 'u2',
    verifierName: 'Raj Patel',
    verifierReputation: 94,
    createdAt: '2025-06-10T09:15:00Z',
  },
  {
    id: 'v2',
    claimId: 'c1',
    verdict: 'FALSE',
    sourceUrl: 'https://ncbi.nlm.nih.gov/dengue-management',
    sourceQuality: 'high',
    explanation:
      'The NCBI review confirms WHO position — no antiviral drug for dengue. Supportive care is the only recommended approach. Misinformation about antibiotics for dengue can lead to antibiotic resistance.',
    verifierId: 'u4',
    verifierName: 'Vikram Singh',
    verifierReputation: 91,
    createdAt: '2025-06-10T11:30:00Z',
  },
  {
    id: 'v3',
    claimId: 'c1',
    verdict: 'FALSE',
    sourceUrl: 'https://timesofindia.indiatimes.com/dengue-myths',
    sourceQuality: 'medium',
    explanation:
      'The Times of India fact-check cites multiple health officials debunking this claim. No government health agency recommends neem leaves or antibiotics for dengue treatment.',
    verifierId: 'u1',
    verifierName: 'Priya Sharma',
    verifierReputation: 87,
    createdAt: '2025-06-10T14:00:00Z',
  },
  {
    id: 'v4',
    claimId: 'c2',
    verdict: 'TRUE',
    sourceUrl: 'https://eci.gov.in/voter-id-requirements',
    sourceQuality: 'high',
    explanation:
      'According to the Election Commission of India, Aadhaar is listed as one of the accepted documents for voter ID application (Form 6). This is correct — it\'s among 12+ accepted ID proofs.',
    verifierId: 'u4',
    verifierName: 'Vikram Singh',
    verifierReputation: 91,
    createdAt: '2025-06-09T08:00:00Z',
  },
  {
    id: 'v5',
    claimId: 'c2',
    verdict: 'TRUE',
    sourceUrl: 'https://ceodelhi.gov.in/voter-registration',
    sourceQuality: 'high',
    explanation:
      'The Delhi CEO website confirms Aadhaar is an accepted document for voter registration. This claim is accurate.',
    verifierId: 'u2',
    verifierName: 'Raj Patel',
    verifierReputation: 94,
    createdAt: '2025-06-09T10:20:00Z',
  },
  {
    id: 'v6',
    claimId: 'c3',
    verdict: 'FALSE',
    sourceUrl: 'https://indianexpress.com/election-eligibility-facts',
    sourceQuality: 'medium',
    explanation:
      'The Indian Express fact-check clarifies that no Indian law requires voters to have a separate mobile phone for their ID. This is a viral WhatsApp rumor without basis in the Representation of the People Act, 1951.',
    verifierId: 'u1',
    verifierName: 'Priya Sharma',
    verifierReputation: 87,
    createdAt: '2025-06-08T16:00:00Z',
  },
  {
    id: 'v7',
    claimId: 'c4',
    verdict: 'MISLEADING',
    sourceUrl: 'https://pib.gov.in/eci-clarification',
    sourceQuality: 'high',
    explanation:
      "The PIB fact-check found the claim MISLEADING. While the viral message correctly states that NOTA exists, it's misleading to claim NOTA votes directly cancel the winning candidate's victory — NOTA only triggers a re-poll if NOTA gets the highest votes.",
    verifierId: 'u2',
    verifierName: 'Raj Patel',
    verifierReputation: 94,
    createdAt: '2025-06-07T12:00:00Z',
  },
  {
    id: 'v8',
    claimId: 'c5',
    verdict: 'MISLEADING',
    sourceUrl: 'https://ayush.gov.in/ayurveda-covid',
    sourceQuality: 'high',
    explanation:
      'While the Ministry of AYUSH does recommend certain practices for general wellness, no clinical trial data shows these specific remedies prevent COVID-19. The message overstates efficacy.',
    verifierId: 'u3',
    verifierName: 'Ananya Gupta',
    verifierReputation: 72,
    createdAt: '2025-06-10T07:00:00Z',
  },
  {
    id: 'v9',
    claimId: 'c5',
    verdict: 'MISLEADING',
    sourceUrl: 'https://icmr.gov.in/covid-guidelines',
    sourceQuality: 'high',
    explanation:
      'ICMR guidelines emphasize vaccination and masks as primary prevention. The AYUSH remedies mentioned may support general immunity but are not proven to prevent COVID infection.',
    verifierId: 'u4',
    verifierName: 'Vikram Singh',
    verifierReputation: 91,
    createdAt: '2025-06-10T09:45:00Z',
  },
  {
    id: 'v10',
    claimId: 'c6',
    verdict: 'FALSE',
    sourceUrl: 'https://iitm.org/scholarship-factcheck',
    sourceQuality: 'medium',
    explanation:
      'The IIT Madras fact-check clarifies this scholarship scheme does not exist. No official announcement has been made about a ₹50,000 scholarship for IIT aspirants from government schools.',
    verifierId: 'u5',
    verifierName: 'Neha Joshi',
    verifierReputation: 68,
    createdAt: '2025-06-06T15:30:00Z',
  },
  {
    id: 'v11',
    claimId: 'c7',
    verdict: 'TRUE',
    sourceUrl: 'https://mohfw.gov.in/helpline',
    sourceQuality: 'high',
    explanation:
      'The Ministry of Health confirmed this helpline number through their official channels. The number matches the government portal listing.',
    verifierId: 'u1',
    verifierName: 'Priya Sharma',
    verifierReputation: 87,
    createdAt: '2025-06-05T11:00:00Z',
  },
  {
    id: 'v12',
    claimId: 'c8',
    verdict: 'CONTESTED',
    sourceUrl: 'https://factcheck.org/common-cold-medicine',
    sourceQuality: 'medium',
    explanation:
      'Medical professionals disagree on this. Some studies suggest zinc lozenges may reduce cold duration by 1-2 days, while others show no significant effect. More research needed.',
    verifierId: 'u3',
    verifierName: 'Ananya Gupta',
    verifierReputation: 72,
    createdAt: '2025-06-04T14:20:00Z',
  },
]

export const MOCK_CLAIMS: Claim[] = [
  {
    id: 'c1',
    text: 'Dengue fever can be cured by eating neem leaves and taking antibiotics within 24 hours of symptoms appearing. Forward this to all your family groups!',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-20T08:00:00Z',
    consensusDeadline: '2026-07-27T08:00:00Z',
    submittedBy: 'u1',
    submittedByName: 'Priya Sharma',
    verdict: 'FALSE',
    confidenceScore: 97,
    verifications: MOCK_VERIFICATIONS.slice(0, 3),
    verificationCount: 3,
    agreementRatio: 1.0,
    avgVerifierReputation: 90.7,
    sourceQualityScore: 95,
  },
  {
    id: 'c2',
    text: 'You can use your Aadhaar card as a valid document to apply for a new voter ID card in India.',
    category: 'political',
    status: 'verified',
    createdAt: '2026-07-19T07:00:00Z',
    consensusDeadline: '2026-07-26T07:00:00Z',
    submittedBy: 'u3',
    submittedByName: 'Ananya Gupta',
    verdict: 'TRUE',
    confidenceScore: 98,
    verifications: MOCK_VERIFICATIONS.slice(3, 5),
    verificationCount: 2,
    agreementRatio: 1.0,
    avgVerifierReputation: 92.5,
    sourceQualityScore: 100,
  },
  {
    id: 'c3',
    text: 'The Election Commission has made it mandatory for every voter to have a separate mobile phone linked to their voter ID. Without a personal phone, your vote will be rejected.',
    category: 'political',
    status: 'verified',
    createdAt: '2026-07-18T11:00:00Z',
    consensusDeadline: '2026-07-25T11:00:00Z',
    submittedBy: 'u5',
    submittedByName: 'Neha Joshi',
    verdict: 'FALSE',
    confidenceScore: 94,
    verifications: MOCK_VERIFICATIONS.slice(5, 6),
    verificationCount: 1,
    agreementRatio: 1.0,
    avgVerifierReputation: 87,
    sourceQualityScore: 85,
  },
  {
    id: 'c4',
    text: 'If NOTA (None of the Above) gets the most votes in an election, the winning candidate is automatically disqualified and the election is declared void.',
    category: 'political',
    status: 'verified',
    createdAt: '2026-07-17T09:30:00Z',
    consensusDeadline: '2026-07-24T09:30:00Z',
    submittedBy: 'u4',
    submittedByName: 'Vikram Singh',
    verdict: 'MISLEADING',
    confidenceScore: 89,
    verifications: MOCK_VERIFICATIONS.slice(6, 7),
    verificationCount: 1,
    agreementRatio: 1.0,
    avgVerifierReputation: 94,
    sourceQualityScore: 90,
  },
  {
    id: 'c5',
    text: 'Drinking kadha (herbal decoction) made of ginger, tulsi, and black pepper every morning can prevent COVID-19 infection. Government of India recommends this.',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-16T06:00:00Z',
    consensusDeadline: '2026-07-23T06:00:00Z',
    submittedBy: 'u5',
    submittedByName: 'Neha Joshi',
    verdict: 'MISLEADING',
    confidenceScore: 86,
    verifications: MOCK_VERIFICATIONS.slice(7, 9),
    verificationCount: 2,
    agreementRatio: 1.0,
    avgVerifierReputation: 81.5,
    sourceQualityScore: 85,
  },
  {
    id: 'c6',
    text: 'IIT Madras is offering a ₹50,000 scholarship for all students from government schools who score above 90% in Class 12. Apply before June 30 through the link below.',
    category: 'financial',
    status: 'verified',
    createdAt: '2026-07-16T14:00:00Z',
    consensusDeadline: '2026-07-23T14:00:00Z',
    submittedBy: 'u3',
    submittedByName: 'Ananya Gupta',
    verdict: 'FALSE',
    confidenceScore: 92,
    verifications: MOCK_VERIFICATIONS.slice(9, 10),
    verificationCount: 1,
    agreementRatio: 1.0,
    avgVerifierReputation: 68,
    sourceQualityScore: 80,
  },
  {
    id: 'c7',
    text: 'The government has launched a new toll-free helpline 14420 for reporting COVID-19 and health emergencies.',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-15T10:00:00Z',
    consensusDeadline: '2026-07-22T10:00:00Z',
    submittedBy: 'u1',
    submittedByName: 'Priya Sharma',
    verdict: 'TRUE',
    confidenceScore: 95,
    verifications: MOCK_VERIFICATIONS.slice(10, 11),
    verificationCount: 1,
    agreementRatio: 1.0,
    avgVerifierReputation: 87,
    sourceQualityScore: 100,
  },
  {
    id: 'c8',
    text: 'Taking zinc supplements can cure the common cold within 24 hours.',
    category: 'health',
    status: 'verified',
    createdAt: '2026-07-14T08:00:00Z',
    consensusDeadline: '2026-07-21T08:00:00Z',
    submittedBy: 'u2',
    submittedByName: 'Raj Patel',
    verdict: 'CONTESTED',
    confidenceScore: 71,
    verifications: MOCK_VERIFICATIONS.slice(11, 12),
    verificationCount: 1,
    agreementRatio: 1.0,
    avgVerifierReputation: 72,
    sourceQualityScore: 65,
  },
  {
    id: 'c9',
    text: 'Mobile phone radiation causes brain cancer — this has been proven by a WHO study published in 2023.',
    category: 'health',
    status: 'pending',
    createdAt: '2026-07-28T16:00:00Z',
    consensusDeadline: '2026-08-04T16:00:00Z',
    submittedBy: 'u3',
    submittedByName: 'Ananya Gupta',
    verdict: undefined,
    confidenceScore: undefined,
    verifications: [],
    verificationCount: 0,
  },
  {
    id: 'c10',
    text: 'The government is planning to impose a 28% GST on all religious donations made through digital payment platforms.',
    category: 'religious',
    status: 'pending',
    createdAt: '2026-07-25T13:00:00Z',
    consensusDeadline: '2026-08-01T13:00:00Z',
    submittedBy: 'u1',
    submittedByName: 'Priya Sharma',
    verdict: undefined,
    confidenceScore: undefined,
    verifications: [],
    verificationCount: 0,
  },
  {
    id: 'c11',
    text: 'A new RBI rule effective July 1 requires all bank accounts to have Aadhaar linked or they will be frozen.',
    category: 'financial',
    status: 'pending',
    createdAt: '2026-07-23T15:00:00Z',
    consensusDeadline: '2026-07-30T15:00:00Z',
    submittedBy: 'u5',
    submittedByName: 'Neha Joshi',
    verdict: undefined,
    confidenceScore: undefined,
    verifications: [],
    verificationCount: 0,
  },
  {
    id: 'c12',
    text: 'Eating bananas at night causes respiratory problems and should be avoided. This is an ancient Ayurvedic teaching.',
    category: 'other',
    status: 'pending',
    createdAt: '2026-07-29T18:00:00Z',
    consensusDeadline: '2026-08-05T18:00:00Z',
    submittedBy: 'u3',
    submittedByName: 'Ananya Gupta',
    verdict: undefined,
    confidenceScore: undefined,
    verifications: [],
    verificationCount: 0,
  },
]

export const MOCK_TRENDING: TrendingWeek = {
  totalClaims: 1_247,
  verifiedClaims: 892,
  falseClaims: 623,
  avgConfidence: 94,
  activeVerifiers: 342,
  weekStart: '2025-06-02T00:00:00Z',
}

export const MOCK_LEADERBOARD: VerifierLeaderboardEntry[] = [
  { uid: 'u2', name: 'Raj Patel', reputation: 94, verifications: 78 },
  { uid: 'u4', name: 'Vikram Singh', reputation: 91, verifications: 65 },
  { uid: 'u1', name: 'Priya Sharma', reputation: 87, verifications: 42 },
  { uid: 'u3', name: 'Ananya Gupta', reputation: 72, verifications: 23 },
  { uid: 'u5', name: 'Neha Joshi', reputation: 68, verifications: 15 },
]
