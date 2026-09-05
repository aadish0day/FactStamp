import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ShieldCheck,
  XCircle,
  TrendingUp,
  AlertCircle,
  ArrowUpDown,
  Search,
  Award,
  Sparkles,
  ExternalLink,
  Flag,
  CalendarDays,
  ShieldAlert,
  Trophy
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { Avatar } from '@/components/ui/Avatar'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Button } from '@/components/ui/Button'
import { ShimmerText } from '@/components/ui/ShimmerText'
import { InteractiveHoverButton } from '@/components/ui/InteractiveHoverButton'
import { FlowButton } from '@/components/ui/FlowButton'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { DashboardChart } from '@/components/DashboardChart'
import { computeWeeklyReport } from '@/lib/weeklyReport'
import { useClaims } from '@/contexts/ClaimsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'

const CATEGORY_COLOR_MAP: Record<string, string> = {
  health: 'var(--color-cat-health)',
  political: 'var(--color-cat-political)',
  financial: 'var(--color-cat-financial)',
  religious: 'var(--color-cat-religious)',
  other: 'var(--color-cat-other)',
}

export function Dashboard() {
  const { claims, flagClaim } = useClaims()
  const { users, isLoading: usersLoading } = useUsers()
  const { user } = useAuth()

  const verifiedClaims = claims.filter((c) => c.status === 'verified')
  const falseClaims = verifiedClaims.filter((c) => c.verdict === 'FALSE')

  // Module 7 — weekly trending report computed live from the claims feed
  const weekly = useMemo(() => computeWeeklyReport(claims), [claims])

  const [searchQuery, setSearchQuery] = useState('')

  // Category distribution data — real counts from Firestore claims
  const categories = ['health', 'political', 'religious', 'financial', 'other'] as const
  const categoryData = categories.map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: verifiedClaims.filter((c) => c.category === cat).length,
  }))

  // Average confidence across verified claims (real data)
  const avgConfidence = verifiedClaims.length
    ? Math.round(
        verifiedClaims.reduce((sum, c) => sum + (c.confidenceScore ?? 0), 0) / verifiedClaims.length
      )
    : 0

  // Top verifiers — sourced directly from the Firestore `users` collection
  const leaderboard = useMemo(
    () =>
      users.slice(0, 5).map((u) => ({
        uid: u.uid,
        name: u.displayName,
        reputation: u.reputation,
        verifications: u.totalVerifications,
      })),
    [users]
  )

  // Status & Sort toggles
  type SortMode = 'count' | 'recent'
  type StatusFilter = 'all' | 'verified' | 'pending'
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return
    setSortMode(mode)
    const label = mode === 'count' ? 'most verified first' : 'most recent first'
    toast(`Sorted by ${label}`, {
      description: 'Updated the claims directory list order.',
      duration: 3000,
    })
  }

  // User submitted claims
  const userSubmittedClaims = useMemo(() => {
    if (!user) return []
    return claims.filter((c) => c.submittedBy === user.uid || c.submittedBy === 'u1')
  }, [claims, user])

  // Filtered & sorted claims directory
  const filteredClaimsList = useMemo(() => {
    if (claims.length === 0) return []

    let list = [...claims]

    if (statusFilter === 'verified') {
      list = list.filter((c) => c.status === 'verified')
    } else if (statusFilter === 'pending') {
      list = list.filter((c) => c.status === 'pending')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          (c.text || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q) ||
          (c.id || '').toLowerCase().includes(q)
      )
    }

    const sorted = list.sort((a, b) => {
      if (sortMode === 'count') return b.verificationCount - a.verificationCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sorted.slice(0, 50).map((c) => ({
      claimId: c.id,
      text: c.text,
      category: c.category,
      status: c.status,
      verdict: c.verdict,
      count: c.verificationCount,
      createdAt: c.createdAt,
    }))
  }, [claims, statusFilter, sortMode, searchQuery])

  // Edge case toast — fires once when the claims list is unexpectedly empty
  useEffect(() => {
    if (claims.length > 0 && filteredClaimsList.length === 0 && !searchQuery) {
      toast('No claims match this filter', {
        description: 'Try a different sort or status option to view data.',
        icon: <AlertCircle className="w-5 h-5 text-[var(--color-v-mislead)]" />,
      })
    }
  }, [filteredClaimsList.length, claims.length, searchQuery])

  // Admin expedite toggle for pending claims
  const pendingClaims = claims.filter((c) => c.status === 'pending')
  const toggleFlag = (claimId: string, currentlyFlagged: boolean) => {
    flagClaim(claimId, !currentlyFlagged).then(() => {
      toast(currentlyFlagged ? 'Flag removed' : 'Claim flagged for expedited review', {
        description: currentlyFlagged
          ? 'The claim returned to the normal verification queue.'
          : 'The claim will surface first in the verification queue.',
        icon: <Flag className="w-5 h-5 text-[var(--color-brand)]" />,
      })
    })
  }

  // Title calculator
  const getVerifierTitle = (reputation: number, verifications: number): string => {
    if (reputation >= 90 && verifications >= 10) return 'Lead Fact-Checker'
    if (reputation >= 80 || verifications >= 5) return 'Senior Analyst'
    if (reputation >= 60 || verifications >= 2) return 'Community Verifier'
    return 'Contributor'
  }

  const verifiedPercentage = claims.length ? Math.round((verifiedClaims.length / claims.length) * 100) : 0
  const falsePercentage = verifiedClaims.length ? Math.round((falseClaims.length / verifiedClaims.length) * 100) : 0
  const confidenceLabel = avgConfidence >= 80 ? 'High confidence' : avgConfidence >= 50 ? 'Moderate' : 'Low confidence'

  const kpis = [
    {
      label: 'Total Claims Verified',
      value: verifiedClaims.length,
      icon: ShieldCheck,
      color: 'var(--color-v-true)',
      bgColor: 'var(--color-v-true-bg)',
      borderColor: 'var(--color-v-true-border)',
      trend: `${verifiedPercentage}% of total`,
    },
    {
      label: 'False Claims Debunked',
      value: falseClaims.length,
      icon: XCircle,
      color: 'var(--color-v-false)',
      bgColor: 'var(--color-v-false-bg)',
      borderColor: 'var(--color-v-false-border)',
      trend: `${falsePercentage}% of verified`,
    },
    {
      label: 'Avg Consensus Score',
      value: avgConfidence,
      icon: TrendingUp,
      suffix: '%',
      color: 'var(--color-brand)',
      bgColor: 'var(--color-brand-subtle)',
      borderColor: 'var(--color-brand-subtle)',
      trend: confidenceLabel,
    },
  ]

  return (
    <div className="w-full max-w-[1400px] mx-auto px-[clamp(1rem,4vw,3rem)] py-8">
      <Seo title="Misinformation Dashboard" description="Weekly trends and community insights on WhatsApp misinformation in India." />
      <Breadcrumbs />

      {/* Header Banner with CTA */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-[var(--color-surface-2)] via-[var(--color-surface)] to-[var(--color-surface-2)] p-6 lg:p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <ShimmerText className="text-xs font-bold text-[var(--color-brand)] font-mono">
              FactStamp Intelligence · {claims.length} Claims Tracked
            </ShimmerText>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-[var(--color-fg)] tracking-tight mb-2">
            Misinformation Dashboard
          </h1>
          <p className="text-sm lg:text-base text-[var(--color-fg-2)] max-w-[65ch] leading-relaxed font-medium">
            Real-time analytics, category distributions, and top verifier leaderboards across viral Indian WhatsApp forwards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 z-10">
          <Link to="/submit">
            <InteractiveHoverButton text="Submit Claim" />
          </Link>
          <Link to="/verify">
            <FlowButton text="Verify Claims Queue" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <SpotlightCard
              key={kpi.label}
              spotlightColor={kpi.bgColor}
              className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: kpi.bgColor, border: `1px solid ${kpi.borderColor}` }}
                >
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} aria-hidden="true" />
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-[var(--radius-sm)] border" style={{ color: kpi.color, backgroundColor: kpi.bgColor, borderColor: kpi.borderColor }}>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-[var(--color-fg)] mb-1 tracking-tight leading-none">
                {kpi.suffix ? (
                  <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                ) : (
                  <AnimatedCounter value={kpi.value} />
                )}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-fg-2)] mt-1.5">{kpi.label}</p>
            </SpotlightCard>
          )
        })}
      </div>

      {/* 2-Column Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8/12 Width): Primary Data Charts & Directory */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Weekly Trending Misinformation Report */}
          <div className="relative overflow-hidden p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-sm text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/20 mb-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="font-mono">Weekly Trending Report</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--color-fg)]">Misinformation Trends — {weekly.weekLabel}</h2>
                <p className="text-sm text-[var(--color-fg-2)] mt-0.5 font-medium">
                  {weekly.weeklyClaimCount} claim{weekly.weeklyClaimCount !== 1 ? 's' : ''} submitted this week · computed live
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-fg-2)] bg-[var(--color-surface-2)]/70 border border-[var(--color-border-soft)] px-2.5 py-1 rounded-sm font-mono font-bold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-[var(--color-v-true)] animate-pulse" style={{ boxShadow: '0 0 6px var(--color-v-true)' }} />
                <span>Updated Live</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top categories this week */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-brand)] border-b border-[var(--color-border-soft)] pb-2">Top Categories</h3>
                <div className="space-y-3.5">
                  {weekly.categoryCounts.map((c) => {
                    const max = weekly.categoryCounts[0]?.count || 1
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--color-fg)] capitalize">{c.category}</span>
                          <span className="text-xs font-mono font-bold text-[var(--color-fg-muted)] tabular-nums">{c.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden border border-[var(--color-border-soft)]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(c.count / max) * 100}%`, backgroundColor: CATEGORY_COLOR_MAP[c.category] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Five most debunked claims this week */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-brand)] border-b border-[var(--color-border-soft)] pb-2">Most Debunked</h3>
                {weekly.debunkedClaims.length === 0 ? (
                  <p className="text-xs text-[var(--color-fg-muted)] py-6 text-center">
                    No claims debunked this week yet
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {weekly.debunkedClaims.map((c) => (
                      <Link
                        key={c.id}
                        to={`/claim/${c.id}`}
                        className="flex items-start gap-2.5 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/40 border border-[var(--color-border-soft)] hover:border-[var(--color-v-false-border)] hover:bg-[var(--color-surface-2)] transition-all group no-underline"
                      >
                        <XCircle className="w-4 h-4 text-[var(--color-v-false)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--color-fg)] line-clamp-2 leading-relaxed group-hover:text-[var(--color-brand)] transition-colors">
                            &ldquo;{c.text}&rdquo;
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <VerdictPill verdict={c.verdict!} size="sm" />
                            <span className="text-xs font-mono font-bold text-[var(--color-fg-muted)] tabular-nums">
                              {c.verificationCount} checks
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Top verifiers by count + accuracy */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-brand)] border-b border-[var(--color-border-soft)] pb-2">Top Performance</h3>
                {weekly.topVerifiers.length === 0 ? (
                  <p className="text-xs text-[var(--color-fg-muted)] py-6 text-center">
                    No verifications recorded yet
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {weekly.topVerifiers.map((v, i) => (
                      <div
                        key={`${v.name}-${i}`}
                        className="flex items-center gap-2.5 p-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/40 border border-[var(--color-border-soft)]"
                      >
                        <span className={`text-xs font-bold font-mono w-5 text-center flex items-center justify-center ${i < 3 ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]'}`}>
                          {i === 0 ? <Trophy className="w-3.5 h-3.5 text-[var(--color-brand)]" aria-hidden="true" /> : `#${i + 1}`}
                        </span>
                        <Avatar initials={v.name[0]} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--color-fg)] truncate leading-tight">{v.name}</p>
                          <p className="text-xs text-[var(--color-fg-muted)] font-mono font-bold mt-0.5">
                            {v.verifications} checks
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--color-v-true)] bg-[var(--color-v-true-bg)] px-2 py-0.5 rounded-full border border-[var(--color-v-true-border)]">
                          {v.accuracy}% acc
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--color-fg)]">Claims by Category</h2>
                <p className="text-sm text-[var(--color-fg-2)] mt-0.5 font-medium">Distribution of verified WhatsApp forwards</p>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-0.5 rounded-sm border border-[var(--color-brand-subtle)]">
                5 Active Categories
              </span>
            </div>
            <DashboardChart categoryData={categoryData} />
          </div>

          {/* Conditional Submitted Claims Card */}
          {userSubmittedClaims.length > 0 && (
            <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-brand-subtle)] shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[var(--color-fg)]">Your Submitted Claims ({userSubmittedClaims.length})</h2>
                  <p className="text-sm text-[var(--color-fg-2)] mt-0.5 font-medium">Track verification progress for claims you submitted</p>
                </div>
                <Link to="/submit">
                  <InteractiveHoverButton text="Submit New" className="min-w-[120px] px-4 py-1.5 min-h-[36px] text-xs" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSubmittedClaims.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/40 border border-[var(--color-border-soft)] hover:border-[var(--color-brand-subtle)] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <CategoryBadge category={c.category} />
                        {c.status === 'verified' && c.verdict ? (
                          <VerdictPill verdict={c.verdict} size="sm" />
                        ) : (
                          <span className="text-xs font-mono font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-0.5 rounded-sm border border-[var(--color-brand-subtle)]">
                            Pending ({c.verificationCount}/3)
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-fg)] line-clamp-2 leading-relaxed">
                        &ldquo;{c.text}&rdquo;
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-border-soft)] text-xs font-mono text-[var(--color-fg-muted)] font-medium">
                      <span>Submitted {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      <Link to={c.status === 'pending' ? `/verify/${c.id}` : `/claim/${c.id}`}>
                        <span className="text-[var(--color-brand)] font-bold hover:underline cursor-pointer">
                          {c.status === 'pending' ? 'View Queue →' : 'View Verdict Card →'}
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Admin Expedite panel */}
          {user?.isAdmin && pendingClaims.length > 0 && (
            <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border-soft)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-brand-subtle)] flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-[var(--color-brand)]" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-fg)]">Admin Expedite Review</h2>
                    <p className="text-sm text-[var(--color-fg-2)] mt-0.5 font-medium">Flag pending claims to surface them first</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-0.5 rounded-sm border border-[var(--color-brand-subtle)]">
                  Admin panel
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingClaims.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border transition-colors ${
                      c.adminFlagged
                        ? 'bg-[var(--color-brand-subtle)]/30 border-[var(--color-brand-subtle)]'
                        : 'bg-[var(--color-surface-2)]/40 border-[var(--color-border-soft)]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CategoryBadge category={c.category} />
                        {c.adminFlagged && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded-sm border border-[var(--color-brand-subtle)]">
                            <Flag className="w-3 h-3" aria-hidden="true" />
                            Expedited
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/claim/${c.id}`}
                        className="text-xs font-semibold text-[var(--color-fg)] line-clamp-2 hover:text-[var(--color-brand)] hover:underline leading-relaxed"
                      >
                        &ldquo;{c.text}&rdquo;
                      </Link>
                      <p className="text-xs text-[var(--color-fg-muted)] font-mono mt-1.5 font-bold">
                        {c.verificationCount}/3 checks · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      intent={c.adminFlagged ? 'secondary' : 'primary'}
                      size="sm"
                      className="flex-shrink-0 h-8 px-3"
                      onClick={() => toggleFlag(c.id, !!c.adminFlagged)}
                    >
                      <Flag className="w-3.5 h-3.5 me-1" aria-hidden="true" />
                      {c.adminFlagged ? 'Unflag' : 'Flag'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Claims Directory (Redesigned with Row Card Explorer layout) */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            
            {/* Explorer Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-bold tracking-tight text-[var(--color-fg)]">
                  Community Claims Directory
                </h2>
                {/* Replaced ugly pill badge with dynamic slash count notation */}
                <span className="text-sm font-mono font-bold text-[var(--color-brand)] tracking-widest">
                  /{filteredClaimsList.length}
                </span>
              </div>

              {/* Filter Action Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input with border focus animation */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
                  <input
                    type="text"
                    placeholder="Search claims..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3.5 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)] w-full sm:w-48 transition-all"
                  />
                </div>

                {/* Status Toggles Capsule */}
                <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] p-1 border border-[var(--color-border-soft)]">
                  {['all', 'verified', 'pending'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter as StatusFilter)}
                      className={`px-3 py-1 text-xs font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer capitalize ${
                        statusFilter === filter
                          ? 'bg-[var(--color-surface)] text-[var(--color-brand)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                          : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                      }`}
                    >
                      {filter === 'pending' ? 'Pending Queue' : filter}
                    </button>
                  ))}
                </div>

                {/* Sort Toggle Capsule */}
                <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] p-1 border border-[var(--color-border-soft)]">
                  <button
                    type="button"
                    onClick={() => handleSortChange('recent')}
                    className={`px-3 py-1 text-xs font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer ${
                      sortMode === 'recent'
                        ? 'bg-[var(--color-surface)] text-[var(--color-brand)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                        : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortChange('count')}
                    className={`px-3 py-1 text-xs font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer flex items-center gap-1.5 ${
                      sortMode === 'count'
                        ? 'bg-[var(--color-surface)] text-[var(--color-brand)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                        : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                    Verified
                  </button>
                </div>
              </div>
            </div>

            {/* Onboarding Quick Guide for first-time visitors */}
            <div className="bg-[var(--color-brand-subtle)] border border-[var(--color-brand)]/15 p-4.5 rounded-[var(--radius-lg)] mb-6 text-sm flex gap-3 items-start relative overflow-hidden">
              <Sparkles className="w-5 h-5 text-[var(--color-brand)] flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-bold text-[var(--color-fg)] tracking-tight">Onboarding Guide:</h4>
                <p className="text-xs sm:text-sm text-[var(--color-fg-2)] leading-relaxed max-w-[85ch] text-pretty font-medium">
                  WhatsApp forwards are verified here via community consensus. Click <span className="font-bold text-[var(--color-brand)]">"Verify"</span> on pending items to review them, or click <span className="font-bold text-[var(--color-fg)]">"View"</span> to read completed verdicts. Once a claim is verified, you can download a stamped card to share back to WhatsApp chats to debunk fake news instantly.
                </p>
              </div>
            </div>

            {/* List Row Cards Explorer Box */}
            <div className="max-h-[500px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar">
              {filteredClaimsList.length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--color-fg-muted)] bg-[var(--color-surface-2)]/30 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)]">
                  No claims match your search or filter criteria.
                </div>
              ) : (
                filteredClaimsList.map((item) => (
                  <div
                    key={item.claimId}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/30 hover:bg-[var(--color-surface-2)]/80 hover:border-[var(--color-brand-subtle)] hover:translate-x-1.5 transition-all duration-300 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0 flex items-start gap-4">
                      {/* Left: Category Column */}
                      <div className="flex-shrink-0 pt-0.5">
                        <CategoryBadge category={item.category} />
                      </div>

                      {/* Center: Claim text & metadata details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <Link
                          to={item.status === 'pending' ? `/verify/${item.claimId}` : `/claim/${item.claimId}`}
                          className="text-sm sm:text-base font-semibold text-[var(--color-fg)] leading-relaxed hover:text-[var(--color-brand)] transition-colors no-underline block max-w-2xl text-pretty"
                        >
                          &ldquo;{item.text}&rdquo;
                        </Link>
                        <div className="flex items-center gap-2.5 text-xs text-[var(--color-fg-muted)] font-mono font-semibold">
                          <span>ID: {item.claimId.slice(0, 8)}</span>
                          <span>•</span>
                          <span>Added {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge & checks count details */}
                    <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-[var(--color-border-soft)] pt-3 md:pt-0">
                      {/* Status verdict tag */}
                      <div className="flex-shrink-0">
                        {item.status === 'verified' && item.verdict ? (
                          <VerdictPill verdict={item.verdict} size="sm" />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--color-v-unverif-bg)] text-[var(--color-v-unverif)] border border-[var(--color-v-unverif-border)]">
                            Pending Review
                          </span>
                        )}
                      </div>

                      {/* Monospace Checks count */}
                      <div className="flex flex-col items-end flex-shrink-0 font-mono">
                        <span className="text-xs font-extrabold text-[var(--color-fg)] tabular-nums">{item.count} / 3 checks</span>
                        <span className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wider font-bold">Consensus</span>
                      </div>

                      {/* Action trigger button */}
                      <Link to={item.status === 'pending' ? `/verify/${item.claimId}` : `/claim/${item.claimId}`} className="no-underline">
                        <Button intent="ghost" size="sm" className="h-8 text-xs font-bold px-3 border border-[var(--color-border-soft)] hover:border-[var(--color-brand)] bg-[var(--color-surface)] shadow-xs transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 me-1.5" />
                          {item.status === 'pending' ? 'Verify' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (4/12 Width): Community social leaderboard & live timeline */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Top Verifiers Leaderboard Card */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[var(--color-fg)]">Top Verifiers</h2>
                <p className="text-sm text-[var(--color-fg-2)] mt-0.5 font-medium">Highest consensus scores this week</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-0.5 rounded-sm border border-[var(--color-brand-subtle)]">
                <Award className="w-3 h-3" />
                <span>Top 5</span>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              usersLoading ? (
                <p className="text-xs text-[var(--color-fg-muted)] text-center py-8 animate-pulse">
                  Loading verifiers…
                </p>
              ) : user ? (
                <p className="text-xs text-[var(--color-fg-muted)] text-center py-8">
                  No verifiers yet
                </p>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-[var(--color-fg-muted)] mb-3 font-semibold">
                    Sign in to see verifier rankings
                  </p>
                  <Link to="/signin">
                    <Button intent="outline" size="sm" className="font-bold">
                      Sign in
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="space-y-3">
                {leaderboard.map((verifier, index) => {
                  const isTop3 = index < 3
                  const title = getVerifierTitle(verifier.reputation, verifier.verifications)
                  return (
                    <div
                      key={`${verifier.uid}-${index}`}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/40 border border-[var(--color-border-soft)] hover:border-[var(--color-brand-subtle)] transition-all"
                    >
                      <span className={`text-xs font-bold font-mono w-6 text-center flex items-center justify-center ${isTop3 ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]'}`}>
                        {index === 0 ? <Trophy className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" /> : `#${index + 1}`}
                      </span>
                      <Avatar initials={verifier.name[0]} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--color-fg)] truncate leading-tight">
                          {verifier.name}
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)] font-mono font-semibold mt-0.5">
                          {title} · {verifier.verifications} checks
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-mono font-bold tabular-nums text-[var(--color-v-true)] bg-[var(--color-v-true-bg)] px-2 py-0.5 rounded-full border border-[var(--color-v-true-border)]">
                          {verifier.reputation}% Rep
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Activity Timeline Card */}
          <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
            <h2 className="text-lg font-bold tracking-tight text-[var(--color-fg)]">Recent Activity</h2>
            <p className="text-sm text-[var(--color-fg-2)] mt-0.5 mb-6 font-medium">Latest claims fact-checked across India</p>

            {verifiedClaims.length === 0 ? (
              <p className="text-xs text-[var(--color-fg-muted)] text-center py-8">
                No verified claims yet
              </p>
            ) : (
              <div className="flex flex-col">
                {verifiedClaims.slice(0, 8).map((claim, i) => (
                  <Link
                    key={claim.id}
                    to={`/claim/${claim.id}`}
                    className="flex items-start gap-4 relative no-underline text-inherit group py-3 px-3 rounded-lg hover:bg-[var(--color-surface-2)]/40 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-4 ring-[var(--color-surface)] z-10"
                        style={{
                          backgroundColor: claim.verdict === 'TRUE' ? 'var(--color-v-true)' : claim.verdict === 'FALSE' ? 'var(--color-v-false)' : 'var(--color-v-mislead)',
                          boxShadow: `0 0 8px ${claim.verdict === 'TRUE' ? 'var(--color-v-true-border)' : claim.verdict === 'FALSE' ? 'var(--color-v-false-border)' : 'var(--color-v-mislead-border)'}`,
                        }}
                        aria-hidden="true"
                      />
                      {i < Math.min(verifiedClaims.length, 8) - 1 && (
                        <span className="w-px flex-1 min-h-[36px] bg-[var(--color-border-soft)] mt-1" aria-hidden="true" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryBadge category={claim.category} />
                        <span className="text-xs text-[var(--color-fg-muted)] font-mono font-bold tabular-nums ml-auto">
                          {formatDistanceToNow(new Date(claim.verifiedAt || claim.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-fg)] truncate leading-relaxed group-hover:text-[var(--color-brand)] transition-colors max-w-[65ch] text-pretty">
                        &ldquo;{claim.text}&rdquo;
                      </p>
                      <div className="mt-1.5">
                        <VerdictPill verdict={claim.verdict!} size="sm" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
