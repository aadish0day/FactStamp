import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  ArrowUpDown,
  Clock,
  Users,
  Star,
  ArrowRight,
  Timer,
  RotateCcw,
  Search,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldAlert,
  Flame,
  Filter,
  Flag
} from 'lucide-react'
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
  { value: 'newest', label: 'Newest Submissions' },
  { value: 'closest', label: 'Closest to Resolving' },
  { value: 'reputation', label: 'Best Rep Match' },
]

const FILTERS = ['All', 'Health', 'Political', 'Religious', 'Financial', 'Other']

function repMatchLabel(count: number): { label: string; level: 'high' | 'medium' | 'low' } {
  if (count >= 2) return { label: 'Strong match', level: 'high' }
  if (count === 1) return { label: 'Good match', level: 'medium' }
  return { label: 'Fair match', level: 'low' }
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
  const [searchQuery, setSearchQuery] = useState('')

  const pendingClaims = getPendingClaims()

  const filteredClaims = useMemo(() => {
    let list = pendingClaims.filter((claim) => {
      if (activeFilter !== 'all' && claim.category !== activeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return claim.text.toLowerCase().includes(q) || claim.category.toLowerCase().includes(q)
      }
      return true
    })

    switch (sortMode) {
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'closest':
        list.sort((a, b) => b.verificationCount - a.verificationCount)
        break
      case 'reputation':
        list.sort((a, b) => {
          const userRep = user?.reputation ?? 50
          const aDiff = Math.abs((a.avgVerifierReputation ?? 50) - userRep)
          const bDiff = Math.abs((b.avgVerifierReputation ?? 50) - userRep)
          return aDiff - bDiff
        })
        break
    }

    // Admin-flagged claims surface first for expedited review
    list.sort((a, b) => (b.adminFlagged ? 1 : 0) - (a.adminFlagged ? 1 : 0))

    return list
  }, [pendingClaims, activeFilter, sortMode, searchQuery, user])

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Seo title="Verification Queue" description="Help fact-check these claims by researching and submitting your verdict with sources." />
      <Breadcrumbs />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-[var(--color-surface-2)] via-[var(--color-surface)] to-[var(--color-surface-2)] p-6 lg:p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Earn +2 Reputation Per Verified Claim</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[var(--color-fg)] tracking-tight mb-2">
            Verification Queue
          </h1>
          <p className="text-sm lg:text-base text-[var(--color-fg-2)] max-w-xl leading-relaxed">
            Review viral WhatsApp claims, inspect sources, and cast your verdict to protect the community.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] p-4 rounded-[var(--radius-lg)]">
          <div className="w-10 h-10 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center text-[var(--color-brand)] font-bold text-lg">
            {pendingClaims.length}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">Pending Claims</p>
            <p className="text-[11px] text-[var(--color-fg-muted)]">Awaiting consensus verification</p>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search + Category Filters + Sort */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
            <input
              type="text"
              placeholder="Search pending claims text or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs lg:text-sm rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-subtle)] shadow-[var(--shadow-xs)]"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-[var(--color-fg-2)] uppercase tracking-wider hidden sm:inline">Sort:</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="text-xs font-bold rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-subtle)] focus:border-[var(--color-brand)] shadow-[var(--shadow-xs)] cursor-pointer"
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((filter) => {
            const value = filter.toLowerCase()
            const isSelected = activeFilter === value
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(value)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-[var(--color-brand)] text-white shadow-[var(--shadow-sm)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border-soft)]'
                )}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-[var(--radius-xl)] bg-[var(--color-surface)] animate-shimmer"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No claims match your search or filter"
          description="Try adjusting your search keywords or switching category filters to view pending claims."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setActiveFilter('all')
              setSearchQuery('')
            },
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] overflow-hidden">
              <div className="grid grid-cols-[1.8fr_110px_120px_110px_90px] gap-4 px-6 py-3.5 bg-[var(--color-surface-2)]/70 border-b border-[var(--color-border-soft)] text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">
                <span>Claim Content</span>
                <span className="text-center">Category</span>
                <span className="text-center">Consensus</span>
                <span className="text-center">Deadline</span>
                <span className="text-right">Action</span>
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.04 } } }}
                className="divide-y divide-[var(--color-border-soft)]"
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

            <p className="mt-4 text-xs font-mono font-bold text-[var(--color-fg-muted)] text-center">
              Showing {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} awaiting community verification
            </p>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="space-y-3"
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

            <p className="text-xs font-mono font-bold text-[var(--color-fg-muted)] text-center pt-2">
              Showing {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} awaiting verification
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function ConsensusTrack({ count, max = 3 }: { count: number; max?: number }) {
  const close = count === max - 1
  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-1.5" role="img" aria-label={`${count} of ${max} verifiers`}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              i < count && 'bg-[var(--color-brand)] border border-[var(--color-brand)] shadow-[0_0_6px_var(--color-brand)]',
              i === count && close && 'border-2 border-dashed border-[var(--color-brand)] animate-pulse',
              i === count && !close && 'border-2 border-dashed border-[var(--color-border-strong)]',
              i > count && 'bg-[var(--color-surface-2)] border border-[var(--color-border-soft)]'
            )}
          />
        ))}
      </div>
      <span className={cn('text-xs font-mono font-bold tabular-nums', close ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]')}>
        {count}/{max}
      </span>
    </div>
  )
}

function WorklistRowDesktop({
  claim,
  userRep,
  onVerify,
}: {
  claim: Claim
  userRep: number
  onVerify: () => void
}) {
  const deadline = timeRemaining(claim.consensusDeadline)

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'grid grid-cols-[1.8fr_110px_120px_110px_90px] gap-4 px-6 py-4 items-center transition-colors',
        deadline.urgent ? 'bg-[var(--color-v-mislead-bg)]/20 hover:bg-[var(--color-v-mislead-bg)]/40' : 'hover:bg-[var(--color-surface-2)]/60'
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <CategoryBadge category={claim.category} />
          {claim.adminFlagged && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-brand-subtle)]">
              <Flag className="w-3 h-3" aria-hidden="true" />
              Expedited
            </span>
          )}
          {claim.verificationCount > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand-subtle)]">
              {claim.verificationCount}/3 Verifiers
            </span>
          )}
          {deadline.urgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-v-mislead)] bg-[var(--color-v-mislead-bg)] px-2 py-0.5 rounded-full border border-[var(--color-v-mislead-border)]">
              <Timer className="w-3 h-3" aria-hidden="true" />
              Urgent
            </span>
          )}
        </div>
        <p className="text-xs lg:text-sm font-medium text-[var(--color-fg)] truncate leading-relaxed">
          &ldquo;{claim.text}&rdquo;
        </p>
        <p className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums mt-1">
          Submitted {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="text-center">
        <span className="text-xs font-bold text-[var(--color-fg-2)] capitalize">{claim.category}</span>
      </div>

      <div className="flex justify-center">
        <ConsensusTrack count={claim.verificationCount} />
      </div>

      <div className="text-center">
        {deadline.expired ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-v-contested)]">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Expired
          </span>
        ) : (
          <div className="flex flex-col items-center">
            <span className={cn(
              'text-xs font-mono font-bold tabular-nums',
              deadline.urgent ? 'text-[var(--color-v-mislead)]' : 'text-[var(--color-fg-2)]'
            )}>
              {deadline.label}
            </span>
          </div>
        )}
      </div>

      <div className="text-right">
        <Button
          intent="primary"
          size="sm"
          onClick={onVerify}
          className="font-bold shadow-[var(--shadow-xs)]"
        >
          Verify
          <ArrowRight className="w-3.5 h-3.5 me-1" aria-hidden="true" />
        </Button>
      </div>
    </motion.div>
  )
}

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

function WorklistRowMobile({
  claim,
  userRep,
  onVerify,
}: {
  claim: Claim
  userRep: number
  onVerify: () => void
}) {
  const deadline = timeRemaining(claim.consensusDeadline)

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'p-5 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]',
        deadline.urgent && 'border-[var(--color-v-mislead-border)] bg-[var(--color-v-mislead-bg)]/10'
      )}
    >
      <button
        type="button"
        onClick={onVerify}
        className="w-full text-left cursor-pointer bg-transparent border-none p-0"
      >
        <div className="flex items-center justify-between mb-3">
          <CategoryBadge category={claim.category} />
          <ConsensusTrack count={claim.verificationCount} />
        </div>

        <p className="text-xs lg:text-sm text-[var(--color-fg)] font-medium line-clamp-2 leading-relaxed mb-3">
          &ldquo;{claim.text}&rdquo;
        </p>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--color-border-soft)]">
          <span className="text-[var(--color-fg-muted)] font-mono tabular-nums">
            {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
          </span>
          <div>
            {deadline.urgent && (
              <span className="inline-flex items-center gap-1 text-[var(--color-v-mislead)] font-bold">
                <Timer className="w-3.5 h-3.5" />
                {deadline.label}
              </span>
            )}
            {!deadline.urgent && !deadline.expired && (
              <span className="font-mono text-[var(--color-fg-2)] font-bold">
                {deadline.label}
              </span>
            )}
          </div>
        </div>
      </button>

      <Button
        intent="primary"
        className="mt-4 w-full font-bold"
        onClick={onVerify}
      >
        {deadline.expired ? 'View Expired Claim' : 'Verify This Claim'}
        <ArrowRight className="w-4 h-4 me-1" aria-hidden="true" />
      </Button>
    </motion.div>
  )
}
