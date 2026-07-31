import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, ArrowUpDown, Clock, Users, Star, ArrowRight, Timer, RotateCcw } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useClaims } from '@/contexts/ClaimsContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Claim } from '@/lib/types'

type SortMode = 'newest' | 'closest' | 'reputation'

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'closest', label: 'Closest to resolving' },
  { value: 'reputation', label: 'Best rep match' },
]

const FILTERS = ['All', 'Health', 'Political', 'Religious', 'Financial', 'Other']

/* ── Mock "reputation match" — how well this claim's needs fit the user ── */
function repMatchLabel(count: number): { label: string; level: 'high' | 'medium' | 'low' } {
  if (count >= 2) return { label: 'Strong match', level: 'high' }
  if (count === 1) return { label: 'Good match', level: 'medium' }
  return { label: 'Fair match', level: 'low' }
}

const levelStyles = {
  high: 'text-[var(--color-v-true)]',
  medium: 'text-[var(--color-accent)]',
  low: 'text-[var(--color-fg-muted)]',
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
}

export function VerifyQueue() {
  const navigate = useNavigate()
  const { getPendingClaims, isLoading } = useClaims()
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('newest')

  const pendingClaims = getPendingClaims()

  const filteredClaims = useMemo(() => {
    let list = pendingClaims.filter((claim) => {
      if (activeFilter === 'all') return true
      return claim.category === activeFilter
    })

    // Sort
    switch (sortMode) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'closest':
        list.sort((a, b) => b.verificationCount - a.verificationCount)
        break
      case 'reputation':
        // "Best rep match" = prefer claims with avg verifier rep close to user's rep
        list.sort((a, b) => {
          const userRep = user?.reputation ?? 50
          const aDiff = Math.abs((a.avgVerifierReputation ?? 50) - userRep)
          const bDiff = Math.abs((b.avgVerifierReputation ?? 50) - userRep)
          return aDiff - bDiff
        })
        break
    }

    return list
  }, [pendingClaims, activeFilter, sortMode, user])

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo title="Verification Queue" description="Help fact-check these claims by researching and submitting your verdict with sources." />
      <Breadcrumbs />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-fg)] mb-1">
            Verification queue
          </h1>
          <p className="text-sm text-[var(--color-fg-2)]">
            Help fact-check these claims by researching and submitting your verdict with sources.
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" aria-hidden="true" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:border-[var(--color-accent)]"
            aria-label="Sort claims"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 mb-6 snap-x scrollbar-none">
        {FILTERS.map((filter) => {
          const value = filter.toLowerCase()
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(value)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors snap-start',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                activeFilter === value
                  ? 'bg-[var(--color-brand)] text-[var(--color-brand-fg)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)]'
              )}
            >
              {filter}
            </button>
          )
        })}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-[var(--radius-md)] animate-shimmer"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="You're caught up — no claims need your verification right now"
          description="The community has cleared all pending claims. Check back later or submit a new claim for the community to verify."
          action={{
            label: 'Submit a claim',
            onClick: () => navigate('/submit'),
          }}
        />
      ) : (
        <>
          {/* ── Desktop: Table layout ── */}
          <div className="hidden sm:block">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-5 py-3 bg-[var(--color-surface-2)]/60 border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                <span>Claim</span>
                <span className="text-center">Category</span>
                <span className="text-center">Consensus</span>
                <span className="text-center">Deadline</span>
                <span className="text-right">Action</span>
              </div>

              {/* Table body */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              >
                {filteredClaims.map((claim) => (
                  <WorklistRowDesktop
                    key={claim.id}
                    claim={claim}
                    userRep={user?.reputation ?? 50}
                    onVerify={() => navigate(`/verify/${claim.id}`)}
                  />
                ))}
              </motion.div>
            </div>

            {/* Result count */}
            <p className="mt-3 text-xs text-[var(--color-fg-muted)] text-center">
              {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} awaiting verification
            </p>
          </div>

          {/* ── Mobile: Tight card list ── */}
          <div className="sm:hidden space-y-3">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            >
              {filteredClaims.map((claim) => (
                <WorklistRowMobile
                  key={claim.id}
                  claim={claim}
                  userRep={user?.reputation ?? 50}
                  onVerify={() => navigate(`/verify/${claim.id}`)}
                />
              ))}
            </motion.div>

            <p className="text-xs text-[var(--color-fg-muted)] text-center pt-2">
              {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} awaiting verification
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Consensus Track — 3-dot verifier progress indicator ── */

function ConsensusTrack({ count, max = 3 }: { count: number; max?: number }) {
  const close = count === max - 1
  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-[5px]" role="img" aria-label={`${count} of ${max} verifiers`}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-[10px] h-[10px] rounded-full transition-all duration-300',
              i < count && 'bg-[var(--color-brand)] border border-[var(--color-brand)]',
              i === count && close && 'border-2 border-dashed border-[var(--color-brand)] animate-pulse',
              i === count && !close && 'border-2 border-dashed border-[var(--color-border-strong)]',
              i > count && 'bg-[var(--color-surface-2)] border border-[var(--color-border-strong)]'
            )}
          />
        ))}
      </div>
      <span className={cn('text-[11px] font-mono tabular-nums', close ? 'text-[var(--color-brand)] font-semibold' : 'text-[var(--color-fg-muted)]')}>
        {count}/{max}
      </span>
    </div>
  )
}

/* ── Desktop row ── */

function WorklistRowDesktop({
  claim,
  userRep,
  onVerify,
}: {
  claim: Claim
  userRep: number
  onVerify: () => void
}) {
  const match = repMatchLabel(claim.verificationCount)
  const repDiff = Math.abs((claim.avgVerifierReputation ?? 50) - userRep)
  const showRepHint = repDiff <= 15
  const deadline = timeRemaining(claim.consensusDeadline)

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'grid grid-cols-[1fr_100px_100px_110px_80px] gap-3 px-5 py-3.5 items-center border-b border-[var(--color-border-soft)] last:border-b-0 transition-colors',
        deadline.urgent ? 'bg-[var(--color-v-mislead-bg)]/30 hover:bg-[var(--color-v-mislead-bg)]/50' : 'hover:bg-[var(--color-surface-2)]/40'
      )}
    >
      {/* Claim excerpt */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={claim.category} />
          {claim.verificationCount > 0 && (
            <Badge variant="info" size="sm">
              {claim.verificationCount}/3
            </Badge>
          )}
          {deadline.urgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-v-mislead)]">
              <Timer className="w-3 h-3" aria-hidden="true" />
              Urgent
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-fg)] truncate leading-relaxed">
          &ldquo;{claim.text}&rdquo;
        </p>
        <p className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums mt-0.5">
          <Clock className="w-3 h-3 inline-block -mt-0.5 me-0.5" aria-hidden="true" />
          {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Category */}
      <div className="text-center">
        <span className="text-xs text-[var(--color-fg-2)] capitalize">{claim.category}</span>
      </div>

      {/* Consensus Track indicator */}
      <div className="flex justify-center">
        <ConsensusTrack count={claim.verificationCount} />
      </div>

      {/* Deadline column */}
      <div className="text-center">
        {deadline.expired ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-v-contested)]">
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Expired
          </span>
        ) : (
          <div className="flex flex-col items-center">
            <span className={cn(
              'text-xs font-mono tabular-nums',
              deadline.urgent ? 'text-[var(--color-v-mislead)] font-semibold' : 'text-[var(--color-fg-2)]'
            )}>
              {deadline.label}
            </span>
            {showRepHint && claim.avgVerifierReputation !== undefined && (
              <span className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">
                Rep: ~{claim.avgVerifierReputation}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="text-right">
        <button
          onClick={onVerify}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] font-semibold text-xs bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          Verify
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  )
}

/* ── Helper: compute remaining time until a deadline ── */

function timeRemaining(deadline: string): { label: string; urgent: boolean; expired: boolean } {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { label: 'Deadline passed', urgent: false, expired: true }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return { label: `${days}d ${hours}h`, urgent: false, expired: false }
  }
  if (hours > 0) {
    return { label: `${hours}h left`, urgent: hours <= 6, expired: false }
  }
  const minutes = Math.floor(diffMs / (1000 * 60))
  return { label: `${minutes}m left`, urgent: true, expired: false }
}

/* ── Mobile row ── */

function WorklistRowMobile({
  claim,
  userRep,
  onVerify,
}: {
  claim: Claim
  userRep: number
  onVerify: () => void
}) {
  const match = repMatchLabel(claim.verificationCount)
  const deadline = timeRemaining(claim.consensusDeadline)

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'hairline-card p-4',
        deadline.urgent && 'border-[var(--color-v-mislead-border)]'
      )}
    >
      <button
        onClick={onVerify}
        className="w-full text-left no-underline text-inherit cursor-pointer bg-transparent border-none p-0"
      >
        {/* Top row: category + consensus dots */}
        <div className="flex items-center justify-between mb-2">
          <CategoryBadge category={claim.category} />
          <ConsensusTrack count={claim.verificationCount} />
        </div>

        {/* Claim text */}
        <p className="text-sm text-[var(--color-fg)] line-clamp-2 leading-relaxed mb-2">
          &ldquo;{claim.text}&rdquo;
        </p>

        {/* Bottom info row */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-fg-muted)] font-mono tabular-nums">
            <Clock className="w-3 h-3 inline-block -mt-0.5 me-0.5" aria-hidden="true" />
            {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-2">
            {deadline.urgent && (
              <span className="inline-flex items-center gap-1 text-[var(--color-v-mislead)] font-semibold">
                <Timer className="w-3 h-3" aria-hidden="true" />
                {deadline.label}
              </span>
            )}
            {!deadline.urgent && !deadline.expired && (
              <span className="font-mono text-[var(--color-fg-muted)] tabular-nums">
                {deadline.label}
              </span>
            )}
            {deadline.expired && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-v-contested)]">
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Expired
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Verify CTA */}
      <button
        onClick={onVerify}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-md)] font-semibold text-sm bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        {deadline.expired ? 'View expired claim' : 'Verify this claim'}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.div>
  )
}
