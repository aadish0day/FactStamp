import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Star, CheckCircle2, XCircle, TrendingUp, Clock, ExternalLink, ShieldAlert, Sprout, Gem, Trophy, Edit3, User, Shield } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useClaims } from '@/contexts/ClaimsContext'
import { formatDistanceToNow } from 'date-fns'
import type { Verification, Verdict } from '@/lib/types'

/* ── Reputation level helper ── */
function repLevel(rep: number): { label: string; icon: typeof Sprout; color: string } {
  if (rep <= 30) return { label: 'Novice', icon: Sprout, color: 'var(--color-v-false)' }
  if (rep <= 60) return { label: 'Trusted', icon: Star, color: 'var(--color-brand)' }
  if (rep <= 85) return { label: 'Expert', icon: Gem, color: 'var(--color-v-true)' }
  return { label: 'Elite', icon: Trophy, color: 'var(--color-accent)' }
}

/* ── Mock sparkline data generator ── */

function generateSparklineData(currentRep: number, points = 10): number[] {
  const data: number[] = []
  let val = Math.max(50, currentRep - Math.floor(Math.random() * 12))
  for (let i = 0; i < points - 1; i++) {
    data.push(Math.round(val))
    val += Math.round((Math.random() - 0.45) * 6)
  }
  data.push(currentRep)
  return data
}

/* ── Sparkline SVG ── */

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null

  const w = 120
  const h = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })

  const d = `M${points.join(' L')}`
  const isUp = data[data.length - 1] >= data[0]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden="true"
      width={w}
      height={h}
    >
      {/* Gradient fill under line */}
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${d} L${w},${h} L0,${h} Z`}
        fill="url(#spark-fill)"
      />
      <path
        d={d}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].split(',')[0]}
        cy={points[points.length - 1].split(',')[1]}
        r="2.5"
        fill="var(--color-accent)"
      />
    </svg>
  )
}

/* ── Helper: calculate consensus match stats ── */

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
  const { user } = useAuth()
  const { claims } = useClaims()

  // Gather verifications by this user across all claims
  const userVerifications = useMemo(() => {
    if (!user) return []
    const result: { verification: Verification; claimText: string; claimId: string; finalVerdict?: Verdict }[] = []
    const finalVerdicts = new Map<string, Verdict | undefined>()

    for (const claim of claims) {
      finalVerdicts.set(claim.id, claim.verdict)
    }

    for (const claim of claims) {
      for (const v of claim.verifications) {
        if (v.verifierId === user.uid) {
          result.push({
            verification: v,
            claimText: claim.text,
            claimId: claim.id,
            finalVerdict: claim.verdict,
          })
        }
      }
    }

    // Sort newest first
    result.sort(
      (a, b) =>
        new Date(b.verification.createdAt).getTime() -
        new Date(a.verification.createdAt).getTime()
    )

    return result
  }, [user, claims])

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

  const sparklineData = useMemo(() => {
    if (!user) return []
    return generateSparklineData(user.reputation)
  }, [user])

  // Reputation level
  const level = user ? repLevel(user.reputation) : null
  const LevelIcon = level?.icon || Shield
  const nextLevel = user
    ? user.reputation <= 30 ? 31
      : user.reputation <= 60 ? 61
        : user.reputation <= 85 ? 86
          : 100
    : 0
  const toNext = user && nextLevel > user.reputation ? nextLevel - user.reputation : 0

  // Edit profile modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState(user?.displayName || '')

  const handleEditSave = () => {
    if (editName.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    toast.success('Profile updated successfully', {
      description: `Display name changed to "${editName.trim()}".`,
    })
    setEditModalOpen(false)
  }

  // Reputation tier: 1.5x multiplier at ≥85
  const weightTier = user && user.reputation >= 85 ? '1.5×' : '1.0×'

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-16 h-16 text-[var(--color-fg-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-[var(--color-fg-2)] mb-6">
          Your reputation and verification history will appear here.
        </p>
        <Button intent="primary" onClick={() => navigate('/signin')}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-[clamp(1rem,4vw,3rem)] py-8 max-w-3xl">
      <Seo title={`${user.displayName} — Verifier Profile`} description={`${user.displayName} has ${user.reputation}% reputation with ${user.totalVerifications} verifications on FactStamp.`} />
      <Breadcrumbs currentLabel="My Profile" />

      <div className="space-y-8 mt-4">
        {/* ── Profile Header ── */}
        <motion.div
          className="hairline-card p-6 sm:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <Avatar initials={user.displayName.charAt(0)} size="xl" online />

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-[var(--color-fg)]">
                {user.displayName}
              </h1>
              <p className="text-sm text-[var(--color-fg-2)] mt-0.5">
                {user.email}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)] mt-1 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                Joined{' '}
                {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}
              </p>
            </div>

            {/* Reputation score — dominant large mono number */}
            <div className="flex flex-col items-center sm:items-end gap-1">
              <span className="text-5xl font-bold font-mono tabular-nums text-[var(--color-fg)] leading-none">
                <AnimatedCounter value={user.reputation} duration={600} />
                <span className="text-2xl text-[var(--color-fg-2)]">%</span>
              </span>
              <div className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-2)]">
                <Star className="w-3 h-3 text-[var(--color-brand)]" aria-hidden="true" />
                Reputation
              </div>
              {/* Reputation level badge */}
              {level && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold mt-0.5"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${level.color} 14%, transparent)`,
                    color: level.color,
                  }}
                >
                  <LevelIcon className="w-3 h-3" aria-hidden="true" />
                  {level.label}
                </span>
              )}
              {toNext > 0 && (
                <p className="text-[10px] text-[var(--color-fg-muted)]">
                  {toNext} pts to next level
                </p>
              )}
              {/* Sparkline */}
              <Sparkline data={sparklineData} className="mt-1" />
            </div>
          </div>
        </motion.div>

        {/* ── Stats Panel (single structured panel) ── */}
        <motion.div
          className="hairline-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.08 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border-soft)]">
            {/* Verdicts cast */}
            <div className="p-5 text-center">
              <p className="text-2xl font-bold font-mono tabular-nums text-[var(--color-fg)]">
                {stats.total}
              </p>
              <p className="text-xs text-[var(--color-fg-2)] mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[var(--color-accent)]" aria-hidden="true" />
                Verdicts cast
              </p>
            </div>

            {/* Consensus match */}
            <div className="p-5 text-center">
              <p className="text-2xl font-bold font-mono tabular-nums text-[var(--color-fg)]">
                {stats.pct}%
              </p>
              <p className="text-xs text-[var(--color-fg-2)] mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-[var(--color-v-true)]" aria-hidden="true" />
                Match consensus
              </p>
            </div>

            {/* Weight multiplier */}
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-[var(--color-fg)]">
                  {weightTier}
                </span>
                {user.reputation >= 85 && (
                  <Badge variant="brand" size="sm">
                    Earned
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[var(--color-fg-2)] mt-1 flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-[var(--color-brand)]" aria-hidden="true" />
                Verdict weight
              </p>
              {user.reputation >= 85 && (
                <p className="text-[10px] text-[var(--color-fg-muted)] mt-1">
                  Your trusted verdicts carry extra weight
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Verdict History ── */}
        <motion.div
          className="hairline-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.16 }}
        >
          <h2 className="text-lg font-bold text-[var(--color-fg)] mb-4">
            Verdict history
          </h2>

          {userVerifications.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No verdicts yet"
              description="You haven't cast any verdicts. Start verifying claims to build your history."
              action={{
                label: 'Verify a claim',
                onClick: () => navigate('/verify'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {userVerifications.map((item, i) => {
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
                    className="block p-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] hover:bg-[var(--color-surface-2)] transition-colors no-underline text-inherit group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: verdict + claim text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono tabular-nums text-[var(--color-fg-muted)]">
                            #{userVerifications.length - i}
                          </span>
                          <VerdictPill verdict={v.verdict} size="sm" />
                          {matchedConsensus !== undefined && (
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-mono tabular-nums ${
                                matchedConsensus
                                  ? 'text-[var(--color-v-true)]'
                                  : 'text-[var(--color-v-false)]'
                              }`}
                            >
                              {matchedConsensus ? (
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <XCircle className="w-3 h-3" aria-hidden="true" />
                              )}
                              {repDelta} rep
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-fg)] line-clamp-1 leading-relaxed">
                          &quot;{item.claimText}&quot;
                        </p>
                      </div>

                      {/* Right: date + arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <time className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums whitespace-nowrap">
                          {formatDistanceToNow(new Date(v.createdAt), {
                            addSuffix: true,
                          })}
                        </time>
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--color-fg-soft)] group-hover:text-[var(--color-accent)] transition-colors flex-shrink-0" aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── Bottom CTA ── */}
        <div className="flex items-center justify-center gap-4">
          <Button
            intent="secondary"
            size="md"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit3 className="w-4 h-4" aria-hidden="true" />
            Edit profile
          </Button>
          <Button intent="primary" onClick={() => navigate('/verify')}>
            Verify more claims
          </Button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="sm">
        <div className="py-4">
          <h3 className="text-lg font-bold text-[var(--color-fg)] mb-1">Edit profile</h3>
          <p className="text-sm text-[var(--color-fg-2)] mb-5">
            Change your display name.
          </p>
          <label htmlFor="edit-name" className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
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
            <Button intent="primary" size="md" onClick={handleEditSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
