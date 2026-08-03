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
  /** Admin accounts can flag claims for expedited review. */
  isAdmin?: boolean
}

export type NotificationType = 'claim_verified' | 'reputation_update' | 'weekly_report' | 'verdict_submitted'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  isRead: boolean
  claimId?: string
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
  imageUrl?: string
  verdict?: Verdict
  confidenceScore?: number
  verifications: Verification[]
  verificationCount: number
  agreementRatio?: number
  avgVerifierReputation?: number
  sourceQualityScore?: number
  /** Admin-flagged claims are surfaced first in the verification queue. */
  adminFlagged?: boolean
  adminFlaggedAt?: string
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
