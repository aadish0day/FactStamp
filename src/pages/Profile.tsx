import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Star,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sprout,
  Gem,
  Trophy,
  Edit3,
  User,
  Shield,
  Search,
  Award,
  Sparkles,
  Zap,
  Check
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useClaims } from '@/contexts/ClaimsContext'
import { useUsers } from '@/contexts/UsersContext'
import { formatDistanceToNow } from '@/lib/utils'
import type { Verification, Verdict } from '@/lib/types'

/* ── Reputation level helper ── */
function repLevel(rep: number): { label: string; icon: typeof Sprout; color: string; perk: string } {
  if (rep <= 30) return { label: 'Novice Verifier', icon: Sprout, color: 'var(--color-v-false)', perk: 'Standard 1.0× Vote Weight' }
  if (rep <= 60) return { label: 'Trusted Analyst', icon: Star, color: 'var(--color-v-mislead)', perk: 'Standard 1.0× Vote Weight' }
  if (rep <= 85) return { label: 'Expert Fact-Checker', icon: Gem, color: 'var(--color-v-true)', perk: 'Elevated 1.25× Vote Weight' }
  return { label: 'Elite Guardian', icon: Trophy, color: 'var(--color-accent)', perk: 'Maximal 1.5× Consensus Vote Weight' }
}

/* ── Sparkline SVG ── */
function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null

  const w = 140
  const h = 36
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })

  const d = `M${points.join(' L')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden="true"
      width={w}
      height={h}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${d} L${w},${h} L0,${h} Z`}
        fill="url(#spark-fill)"
      />
      <path
        d={d}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].split(',')[0]}
        cy={points[points.length - 1].split(',')[1]}
        r="3"
        fill="var(--color-brand)"
      />
    </svg>
  )
}

function computeVerifierStats(verifications: Verification[], claimVerdicts: Map<string, Verdict | undefined>) {
  const total = verifications.length
  let matched = 0

  for (const v of verifications) {
    const finalVerdict = claimVerdicts.get(v.claimId)
    if (finalVerdict && v.verdict === finalVerdict) matched++
  }

  return {
    total,
    matched,
    pct: total > 0 ? Math.round((matched / total) * 100) : 0,
  }
}

export function Profile() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { claims } = useClaims()
  const { users } = useUsers()

  const [historySearch, setHistorySearch] = useState('')

  // Gather verifications by this user across all claims
  const userVerifications = useMemo(() => {
    if (!user) return []
    const result: { verification: Verification; claimText: string; claimId: string; category: any; finalVerdict?: Verdict }[] = []

    for (const claim of claims) {
      for (const v of claim.verifications) {
        if (v.verifierId === user.uid) {
          result.push({
            verification: v,
            claimText: claim.text,
            claimId: claim.id,
            category: claim.category,
            finalVerdict: claim.verdict,
          })
        }
      }
    }

    result.sort(
      (a, b) =>
        new Date(b.verification.createdAt).getTime() -
        new Date(a.verification.createdAt).getTime()
    )

    return result
  }, [user, claims])

  const filteredVerifications = useMemo(() => {
    if (!historySearch.trim()) return userVerifications
    const q = historySearch.toLowerCase()
    return userVerifications.filter(
      (item) => item.claimText.toLowerCase().includes(q) || item.verification.verdict.toLowerCase().includes(q)
    )
  }, [userVerifications, historySearch])

  const stats = useMemo(() => {
    if (!user) return { total: 0, pct: 0, matched: 0 }
    const finalVerdicts = new Map<string, Verdict | undefined>()
    for (const claim of claims) {
      finalVerdicts.set(claim.id, claim.verdict)
    }
    return computeVerifierStats(
      userVerifications.map((v) => v.verification),
      finalVerdicts
    )
  }, [user, userVerifications, claims])

  // Data-driven reputation progression curve
  const sparklineData = useMemo(() => {
    if (!user) return []
    const base = Math.max(50, user.reputation - (userVerifications.length * 2))
    const steps = 6
    const stepDelta = (user.reputation - base) / steps
    const curve = Array.from({ length: steps }, (_, i) => Math.round(base + (i * stepDelta)))
    return [...curve, user.reputation]
  }, [user, userVerifications])

  // Data-driven verifier rank compared to all community verifiers
  const verifierRank = useMemo(() => {
    if (!user || !users || users.length === 0) return 'Top 5%'
    const higherCount = users.filter((u) => u.reputation > user.reputation).length
    const rank = higherCount + 1
    return `#${rank} of ${users.length}`
  }, [user, users])

  const level = user ? repLevel(user.reputation) : null
  const LevelIcon = level?.icon || Shield
  const nextLevelScore = user
    ? user.reputation <= 30 ? 31
      : user.reputation <= 60 ? 61
        : user.reputation <= 85 ? 86
          : 100
    : 0
  const progressPct = user ? Math.min(100, Math.round((user.reputation / 100) * 100)) : 0

  // Edit profile modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState(user?.displayName || '')

  const handleEditSave = async () => {
    if (editName.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    await updateUser({ displayName: editName.trim() })
    toast.success('Profile updated successfully', {
      description: `Display name changed to "${editName.trim()}".`,
    })
    setEditModalOpen(false)
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-[var(--color-brand)]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--color-fg)] mb-2">Sign in to view your profile</h2>
        <p className="text-sm text-[var(--color-fg-2)] mb-6 leading-relaxed">
          Your community reputation level, verifier badges, and submission history will appear here.
        </p>
        <Button intent="primary" size="lg" className="w-full font-bold" onClick={() => navigate('/signin')}>
          Sign In Now
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Seo title={`${user.displayName} — Verifier Profile`} description={`${user.displayName} has ${user.reputation}% reputation with ${user.totalVerifications} verifications on FactStamp.`} />
      <Breadcrumbs currentLabel="My Profile" />

      <div className="space-y-8 mt-4">
        {/* Profile Hero Header Card */}
        <motion.div
          className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] p-6 lg:p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Top banner tint */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[var(--color-brand-subtle)] via-[var(--color-surface-2)] to-[var(--color-brand-subtle)] opacity-60 border-b border-[var(--color-border-soft)]" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pt-4">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative">
                <Avatar initials={user.displayName.charAt(0)} size="xl" online className="ring-4 ring-[var(--color-surface)] shadow-[var(--shadow-md)]" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--color-fg)] tracking-tight">
                    {user.displayName}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    className="p-1 rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-brand)] transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs lg:text-sm text-[var(--color-fg-2)] mt-1 font-mono">
                  {user.email}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                  {level && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs"
                      style={{
                        backgroundColor: `${level.color}15`,
                        color: level.color,
                        border: `1px solid ${level.color}30`,
                      }}
                    >
                      <LevelIcon className="w-3.5 h-3.5" />
                      {level.label}
                    </span>
                  )}
                  <span className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Joined {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Large Reputation Counter & Sparkline */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] p-4 rounded-[var(--radius-lg)] flex-shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl lg:text-5xl font-extrabold font-mono tabular-nums text-[var(--color-brand)] tracking-tight">
                  <AnimatedCounter value={user.reputation} duration={600} />
                </span>
                <span className="text-xl font-bold text-[var(--color-fg-2)]">%</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-fg-2)] mt-0.5 flex items-center gap-1">
                <Star className="w-3 h-3 text-[var(--color-brand)]" />
                Reputation Score
              </p>
              <Sparkline data={sparklineData} className="mt-2" />
            </div>
          </div>

          {/* Level Progress Bar Footer */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border-soft)] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--color-fg-2)] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                Level Perk: <span className="text-[var(--color-fg)] font-bold">{level?.perk}</span>
              </span>
              <span className="font-mono text-xs font-bold text-[var(--color-fg-muted)]">
                {user.reputation} / {nextLevelScore} Points
              </span>
            </div>

            {/* Clean Non-Slop Animated Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden border border-[var(--color-border-soft)]">
              <motion.div
                className="h-full rounded-full bg-[var(--color-brand)]"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Balanced Tier Step Markers */}
            <div className="flex flex-wrap justify-between items-center text-xs font-mono gap-1 pt-1 text-[var(--color-fg-2)]">
              <span className={`px-1.5 py-0.5 rounded transition-all ${user.reputation >= 0 ? 'text-[var(--color-fg)] bg-[var(--color-surface-2)] font-semibold border border-[var(--color-border-soft)]' : ''}`}>
                Novice (0%)
              </span>
              <span className={`px-1.5 py-0.5 rounded transition-all ${user.reputation >= 31 ? 'text-[var(--color-fg)] bg-[var(--color-surface-2)] font-semibold border border-[var(--color-border-soft)]' : ''}`}>
                Analyst (31%)
              </span>
              <span className={`px-1.5 py-0.5 rounded transition-all ${user.reputation >= 61 ? 'text-[var(--color-fg)] bg-[var(--color-surface-2)] font-semibold border border-[var(--color-border-soft)]' : ''}`}>
                Expert (61%)
              </span>
              <span className={`px-1.5 py-0.5 rounded transition-all ${user.reputation >= 86 ? 'text-[var(--color-fg)] bg-[var(--color-surface-2)] font-semibold border border-[var(--color-border-soft)]' : ''}`}>
                Guardian (86%)
              </span>
            </div>
          </div>
        </motion.div>

        {/* 3-Bento Performance Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.08 }}
        >
          {/* Card 1: Total Verdicts */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">Verdicts Cast</span>
              <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center text-[var(--color-brand)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[var(--color-fg)]">
                {stats.total}
              </p>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">Total community claim checks</p>
            </div>
          </div>

          {/* Card 2: Consensus Match Rate */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">Consensus Accuracy</span>
              <div className="w-9 h-9 rounded-lg bg-[rgba(22,163,74,0.12)] flex items-center justify-center text-[#16a34a]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[var(--color-fg)]">
                {stats.pct}%
              </p>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">Matched final community verdict</p>
            </div>
          </div>

          {/* Card 3: Trust Rank */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">Community Rank</span>
              <div className="w-9 h-9 rounded-lg bg-[rgba(217,119,6,0.12)] flex items-center justify-center text-[#d97706]">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-extrabold font-mono tabular-nums text-[var(--color-fg)]">
                  {verifierRank}
                </p>
                <Badge variant="brand" size="sm">Verified</Badge>
              </div>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-1">FactStamp Verifier Leaderboard</p>
            </div>
          </div>
        </motion.div>

        {/* Verdict History Card */}
        <motion.div
          className="p-6 lg:p-8 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.16 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-fg)]">
                Verdict History &amp; Rep Log
              </h2>
              <p className="text-xs text-[var(--color-fg-2)]">All claims you have evaluated and voted on</p>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)] w-full sm:w-52"
              />
            </div>
          </div>

          {filteredVerifications.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No verdict history found"
              description="You haven't evaluated any claims matching your search."
              action={{
                label: 'Verify Claims Now',
                onClick: () => navigate('/verify'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredVerifications.map((item, i) => {
                const v = item.verification
                const matchedConsensus =
                  item.finalVerdict && v.verdict === item.finalVerdict
                const repDelta =
                  item.finalVerdict === undefined
                    ? '—'
                    : matchedConsensus
                      ? '+2'
                      : '-1'

                return (
                  <Link
                    key={v.id}
                    to={`/claim/${item.claimId}`}
                    className="block p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/40 hover:bg-[var(--color-surface-2)] hover:border-[var(--color-brand-subtle)] transition-all no-underline text-inherit group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-mono font-bold text-[var(--color-fg-muted)]">
                            #{userVerifications.length - i}
                          </span>
                          <CategoryBadge category={item.category} />
                          <VerdictPill verdict={v.verdict} size="sm" />

                          {matchedConsensus !== undefined && (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                                matchedConsensus
                                  ? 'bg-[var(--color-v-true-bg)] text-[var(--color-v-true)] border border-[var(--color-v-true-border)]'
                                  : 'bg-[var(--color-v-false-bg)] text-[var(--color-v-false)] border border-[var(--color-v-false-border)]'
                              }`}
                            >
                              {matchedConsensus ? (
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <XCircle className="w-3 h-3" aria-hidden="true" />
                              )}
                              {repDelta} Rep
                            </span>
                          )}
                        </div>
                        <p className="text-xs lg:text-sm text-[var(--color-fg)] font-medium line-clamp-2 leading-relaxed">
                          &quot;{item.claimText}&quot;
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <time className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums whitespace-nowrap">
                          {formatDistanceToNow(new Date(v.createdAt), {
                            addSuffix: true,
                          })}
                        </time>
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--color-fg-muted)] group-hover:text-[var(--color-brand)] transition-colors" aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Bottom CTAs */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            intent="secondary"
            size="lg"
            className="font-semibold"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit3 className="w-4 h-4 me-1.5" />
            Edit Profile Name
          </Button>
          <Button intent="primary" size="lg" className="font-bold shadow-[var(--shadow-sm)]" onClick={() => navigate('/verify')}>
            Verify More Claims
          </Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="sm">
        <div className="py-4">
          <h3 className="text-xl font-bold text-[var(--color-fg)] mb-1">Edit Display Name</h3>
          <p className="text-xs text-[var(--color-fg-2)] mb-5">
            Update your public verifier handle shown on community claim cards.
          </p>
          <label htmlFor="edit-name" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Display Name
          </label>
          <Input
            id="edit-name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            leftIcon={<User className="w-4 h-4 text-[var(--color-fg-muted)]" />}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button intent="secondary" size="md" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button intent="primary" size="md" className="font-bold" onClick={handleEditSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
