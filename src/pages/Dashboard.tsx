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
  ChevronDown,
  ChevronRight,
  Eye,
  Search,
  Plus,
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
import { Marquee } from '@/components/ui/Marquee'
import { InteractiveHoverButton } from '@/components/ui/InteractiveHoverButton'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { DashboardChart } from '@/components/DashboardChart'
import { ContrastChecker } from '@/components/ContrastChecker'
import { computeWeeklyReport } from '@/lib/weeklyReport'
import { useClaims } from '@/contexts/ClaimsContext'
import { useUsers } from '@/contexts/UsersContext'
import { useAuth } from '@/contexts/AuthContext'

const CATEGORY_COLOR_MAP: Record<string, string> = {
  health: '#16a34a',
  political: '#dc2626',
  financial: '#d97706',
  religious: '#7c3aed',
  other: '#0284c7',
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
  // (already ordered by reputation desc by the realtime subscription).
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

  // Sort toggle
  type SortMode = 'count' | 'recent'
  const [sortMode, setSortMode] = useState<SortMode>('count')

  const handleSortChange = (mode: SortMode) => {
    if (mode === sortMode) return
    setSortMode(mode)
    const label = mode === 'count' ? 'most verified first' : 'most recent first'
    toast(`Sorted by ${label}`, {
      description: 'Updated the Most debunked claims list order.',
      duration: 3000,
    })
  }

  // Filtered & sorted debunked claims
  const mostDebunked = useMemo(() => {
    if (verifiedClaims.length === 0) return []

    let list = [...verifiedClaims]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((c) => c.text.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
    }

    const sorted = list.sort((a, b) => {
      if (sortMode === 'count') return b.verificationCount - a.verificationCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sorted.slice(0, 6).map((c) => ({
      claimId: c.id,
      text: c.text,
      category: c.category,
      verdict: c.verdict!,
      count: c.verificationCount,
      createdAt: c.createdAt,
    }))
  }, [verifiedClaims, sortMode, searchQuery])

  // Edge case toast — fires once when the debunked list is unexpectedly empty
  useEffect(() => {
    if (verifiedClaims.length > 0 && mostDebunked.length === 0 && !searchQuery) {
      toast('No claims match this filter', {
        description: 'Try a different sort option to view data.',
        icon: <AlertCircle className="w-5 h-5 text-[var(--color-v-mislead)]" />,
      })
    }
  }, [mostDebunked.length, verifiedClaims.length, searchQuery])

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

  // Dev contrast checker toggle
  const [showContrast, setShowContrast] = useState(false)

  const kpis = [
    {
      label: 'Total Claims Verified',
      value: verifiedClaims.length,
      icon: ShieldCheck,
      color: 'var(--color-v-true)',
      bgColor: 'var(--color-v-true-bg)',
      borderColor: 'var(--color-v-true-border)',
      trend: '+12% this week',
    },
    {
      label: 'False Claims Debunked',
      value: falseClaims.length,
      icon: XCircle,
      color: 'var(--color-v-false)',
      bgColor: 'var(--color-v-false-bg)',
      borderColor: 'var(--color-v-false-border)',
      trend: '84% of submissions',
    },
    {
      label: 'Avg Consensus Score',
      value: avgConfidence,
      icon: TrendingUp,
      suffix: '%',
      color: 'var(--color-brand)',
      bgColor: 'var(--color-brand-subtle)',
      borderColor: 'var(--color-brand-subtle)',
      trend: 'High confidence',
    },
  ]

  const VERIFIER_TITLES = ['Lead Fact-Checker', 'Senior Analyst', 'Community Verifier', 'Fact Guardian', 'Active Analyst']

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo title="Misinformation Dashboard" description="Weekly trends and community insights on WhatsApp misinformation in India." />
      <Breadcrumbs />

      {/* Header Banner with CTA */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 bg-gradient-to-r from-[var(--color-surface-2)] via-[var(--color-surface)] to-[var(--color-surface-2)] p-6 lg:p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <ShimmerText className="text-xs font-bold text-[var(--color-brand)]">FactStamp Live Intelligence</ShimmerText>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[var(--color-fg)] tracking-tight mb-2">
            Misinformation Dashboard
          </h1>
          <p className="text-sm lg:text-base text-[var(--color-fg-2)] max-w-xl leading-relaxed">
            Real-time analytics, category distributions, and top verifier leaderboards across viral Indian WhatsApp forwards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 z-10">
          <Link to="/submit">
            <InteractiveHoverButton text="Submit Claim" />
          </Link>
          <Link to="/verify">
            <Button intent="secondary" size="lg" className="font-semibold">
              <ShieldCheck className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" />
              Verify Claims Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full" style={{ color: kpi.color, backgroundColor: kpi.bgColor }}>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-3xl font-extrabold font-mono tabular-nums text-[var(--color-fg)] mb-1 tracking-tight">
                {kpi.suffix ? (
                  <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                ) : (
                  <AnimatedCounter value={kpi.value} />
                )}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">{kpi.label}</p>
            </SpotlightCard>
          )
        })}
      </div>

      {/* Weekly Trending Misinformation Report — Module 7 */}
      <div className="relative overflow-hidden p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-2">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Weekly Trending Report</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--color-fg)]">Misinformation trends — {weekly.weekLabel}</h2>
            <p className="text-xs text-[var(--color-fg-2)]">
              {weekly.weeklyClaimCount} claim{weekly.weeklyClaimCount !== 1 ? 's' : ''} submitted this week · computed live from Firestore
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)] bg-[var(--color-surface-2)]/70 border border-[var(--color-border-soft)] px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            <span>Auto-generated Monday 00:00 IST</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top categories this week */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-3">Most submitted categories</h3>
            <div className="space-y-3">
              {weekly.categoryCounts.map((c) => {
                const max = weekly.categoryCounts[0]?.count || 1
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--color-fg)] capitalize">{c.category}</span>
                      <span className="text-xs font-mono tabular-nums text-[var(--color-fg-muted)]">{c.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
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
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-3">Most debunked claims</h3>
            {weekly.debunkedClaims.length === 0 ? (
              <p className="text-xs text-[var(--color-fg-muted)] py-8 text-center">
                No claims debunked this week yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {weekly.debunkedClaims.map((c) => (
                  <Link
                    key={c.id}
                    to={`/claim/${c.id}`}
                    className="flex items-start gap-2.5 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] hover:border-[var(--color-v-false-border)] transition-colors group"
                  >
                    <XCircle className="w-4 h-4 text-[var(--color-v-false)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--color-fg)] line-clamp-2 group-hover:text-[var(--color-v-false)] transition-colors leading-relaxed">
                        &ldquo;{c.text}&rdquo;
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-mono font-bold text-[var(--color-fg-muted)]">
                        <VerdictPill verdict={c.verdict!} size="sm" />
                        <span>{c.verificationCount} verifications</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top verifiers by count + accuracy */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-3">Top verifiers by accuracy</h3>
            {weekly.topVerifiers.length === 0 ? (
              <p className="text-xs text-[var(--color-fg-muted)] py-8 text-center">
                No verifications recorded yet
              </p>
            ) : (
              <div className="space-y-2.5">
                {weekly.topVerifiers.map((v, i) => (
                  <div
                    key={`${v.name}-${i}`}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)]"
                  >
                    <span className={`text-xs font-bold font-mono w-5 text-center flex items-center justify-center ${i < 3 ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]'}`}>
                      {i === 0 ? <Trophy className="w-3.5 h-3.5 text-[var(--color-brand)]" aria-hidden="true" /> : `#${i + 1}`}
                    </span>
                    <Avatar initials={v.name[0]} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--color-fg)] truncate">{v.name}</p>
                      <p className="text-[10px] text-[var(--color-fg-muted)] font-medium mt-0.5">
                        {v.verifications} verification{v.verifications !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-[var(--color-v-true)] bg-[var(--color-v-true-bg)] px-2 py-0.5 rounded-full border border-[var(--color-v-true-border)]">
                      {v.accuracy}% acc
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 mb-10">
        {/* Category Distribution Chart Card */}
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-fg)]">Claims by Category</h2>
              <p className="text-xs text-[var(--color-fg-2)]">Distribution of verified WhatsApp forwards</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-1 rounded-full border border-[var(--color-brand-subtle)]">
              5 Active Categories
            </span>
          </div>
          <DashboardChart categoryData={categoryData} />
        </div>

        {/* Top Verifiers Leaderboard Card */}
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-fg)]">Top Verifiers This Week</h2>
              <p className="text-xs text-[var(--color-fg-2)]">Community members with highest consensus score</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-1 rounded-full border border-[var(--color-brand-subtle)]">
              <Award className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
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
                <p className="text-xs text-[var(--color-fg-muted)] mb-3">
                  Sign in to see the verifier leaderboard
                </p>
                <Link to="/signin">
                  <Button intent="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
              </div>
            )
          ) : (
          <div className="space-y-3">
            {leaderboard.map((verifier, index) => {
              const ranks = ['#1', '#2', '#3', '#4', '#5']
              const isTop3 = index < 3
              return (
                <div
                  key={`${verifier.uid}-${index}`}
                  className="flex items-center gap-3.5 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] hover:border-[var(--color-brand-subtle)] transition-all"
                >
                  <span className={`text-xs font-bold font-mono w-6 text-center flex items-center justify-center ${isTop3 ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg-muted)]'}`}>
                    {index === 0 ? <Trophy className="w-4 h-4 text-[var(--color-brand)]" aria-hidden="true" /> : ranks[index]}
                  </span>
                  <Avatar initials={verifier.name[0]} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[var(--color-fg)] truncate leading-tight">
                        {verifier.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-[var(--color-fg-muted)] font-medium mt-0.5">
                      {VERIFIER_TITLES[index]} · {verifier.verifications} checks
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono tabular-nums text-[var(--color-v-true)] bg-[var(--color-v-true-bg)] px-2 py-0.5 rounded-full border border-[var(--color-v-true-border)] font-bold">
                      {verifier.reputation}% Rep
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </div>
      </div>

      {/* Most Debunked Claims Table Card */}
      <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-fg)]">Most Debunked Claims</h2>
            <p className="text-xs text-[var(--color-fg-2)]">Virally forwarded misinformation flagged by the community</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
              <input
                type="text"
                placeholder="Search claims..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-brand)] w-44"
              />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] p-1 border border-[var(--color-border-soft)]">
              <button
                type="button"
                onClick={() => handleSortChange('count')}
                className={`px-3 py-1 text-xs font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer ${
                  sortMode === 'count'
                    ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                }`}
              >
                <ArrowUpDown className="w-3 h-3 inline me-1" aria-hidden="true" />
                Most Verified
              </button>
              <button
                type="button"
                onClick={() => handleSortChange('recent')}
                className={`px-3 py-1 text-xs font-bold rounded-[calc(var(--radius-lg)-2px)] transition-all cursor-pointer ${
                  sortMode === 'recent'
                    ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                }`}
              >
                Most Recent
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-soft)] text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Claim Content</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4 text-right font-mono">Verifications</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-soft)]">
              {mostDebunked.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--color-fg-muted)]">
                    No claims match your search or filter
                  </td>
                </tr>
              ) : (
                mostDebunked.map((item) => (
                  <tr key={item.claimId} className="hover:bg-[var(--color-surface-2)]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[var(--color-fg)] max-w-sm">
                      <Link
                        to={`/claim/${item.claimId}`}
                        className="hover:text-[var(--color-brand)] hover:underline line-clamp-2 leading-relaxed"
                      >
                        &ldquo;{item.text}&rdquo;
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <VerdictPill verdict={item.verdict} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--color-fg)] text-right font-mono font-bold tabular-nums">
                      {item.count}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/claim/${item.claimId}`}>
                        <Button intent="ghost" size="sm" className="h-7 text-xs px-2.5">
                          <ExternalLink className="w-3 h-3 me-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Panel — Expedite Review (Module 7) */}
      {user?.isAdmin && pendingClaims.length > 0 && (
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-brand)] shadow-[var(--shadow-md)] mb-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-brand-subtle)] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-[var(--color-brand)]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-fg)]">Admin Panel — Expedited Review</h2>
                <p className="text-xs text-[var(--color-fg-2)]">
                  Flag pending claims to surface them first in the verification queue.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2.5 py-1 rounded-full border border-[var(--color-brand-subtle)]">
              Admin only
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pendingClaims.map((c) => (
              <div
                key={c.id}
                className={`flex items-start gap-3 p-4 rounded-[var(--radius-lg)] border transition-colors ${
                  c.adminFlagged
                    ? 'bg-[var(--color-brand-subtle)]/40 border-[var(--color-brand-subtle)]'
                    : 'bg-[var(--color-surface-2)]/60 border-[var(--color-border-soft)]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryBadge category={c.category} />
                    {c.adminFlagged && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-brand-subtle)]">
                        <Flag className="w-3 h-3" aria-hidden="true" />
                        Expedited
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/claim/${c.id}`}
                    className="text-xs font-medium text-[var(--color-fg)] line-clamp-2 hover:text-[var(--color-brand)] hover:underline transition-colors leading-relaxed"
                  >
                    &ldquo;{c.text}&rdquo;
                  </Link>
                  <p className="text-[10px] text-[var(--color-fg-muted)] font-mono mt-1.5">
                    {c.verificationCount}/3 verifications · submitted {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  intent={c.adminFlagged ? 'secondary' : 'primary'}
                  size="sm"
                  className="flex-shrink-0 h-8 px-3"
                  onClick={() => toggleFlag(c.id, !!c.adminFlagged)}
                  title={c.adminFlagged ? 'Remove expedited flag' : 'Flag for expedited review'}
                >
                  <Flag className="w-3.5 h-3.5 me-1" aria-hidden="true" />
                  {c.adminFlagged ? 'Unflag' : 'Flag'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Timeline Card */}
      <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] mb-10">
        <h2 className="text-lg font-bold text-[var(--color-fg)] mb-1">Recent Community Activity</h2>
        <p className="text-xs text-[var(--color-fg-2)] mb-6">Latest claims fact-checked across India</p>

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
                className="flex items-start gap-4 relative no-underline text-inherit group py-3 px-3 rounded-lg hover:bg-[var(--color-surface-2)]/60 transition-colors"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <span
                    className="w-3 h-3 rounded-full ring-4 ring-[var(--color-surface)] z-10"
                    style={{
                      backgroundColor: claim.verdict === 'TRUE' ? '#16a34a' : claim.verdict === 'FALSE' ? '#dc2626' : '#d97706',
                      boxShadow: `0 0 8px ${claim.verdict === 'TRUE' ? '#16a34a' : claim.verdict === 'FALSE' ? '#dc2626' : '#d97706'}40`,
                    }}
                    aria-hidden="true"
                  />
                  {i < Math.min(verifiedClaims.length, 8) - 1 && (
                    <span className="w-px flex-1 min-h-[28px] bg-[var(--color-border-soft)] mt-1" aria-hidden="true" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryBadge category={claim.category} />
                    <span className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums me-auto">
                      {formatDistanceToNow(new Date(claim.verifiedAt || claim.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs lg:text-sm font-medium text-[var(--color-fg)] truncate leading-relaxed group-hover:text-[var(--color-brand)] transition-colors">
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

      {/* APCA Contrast Audit — collapsible dev card */}
      <div className="p-4 rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
        <button
          onClick={() => setShowContrast((prev) => !prev)}
          className="flex items-center justify-between w-full text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] flex items-center justify-center">
              <Eye className="w-4 h-4 text-[var(--color-brand)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--color-fg)]">
                Design Token Contrast Audit (APCA)
              </h3>
              <p className="text-[10px] text-[var(--color-fg-muted)]">
                Accessibility compliance tool {showContrast ? '' : '(click to expand)'}
              </p>
            </div>
          </div>
          <span className="text-[var(--color-fg-muted)]">
            {showContrast ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            showContrast ? 'max-h-[3000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <ContrastChecker />
        </div>
      </div>
    </div>
  )
}
