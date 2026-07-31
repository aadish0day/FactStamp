import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { ShieldCheck, XCircle, TrendingUp, AlertCircle, ArrowUpDown, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { Avatar } from '@/components/ui/Avatar'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { DashboardChart } from '@/components/DashboardChart'
import { ContrastChecker } from '@/components/ContrastChecker'
import { useClaims } from '@/contexts/ClaimsContext'
import { MOCK_TRENDING, MOCK_LEADERBOARD, type Claim } from '@/lib/types'

export function Dashboard() {
  const { claims } = useClaims()

  const verifiedClaims = claims.filter((c) => c.status === 'verified')
  const falseClaims = verifiedClaims.filter((c) => c.verdict === 'FALSE')

  // Category distribution data
  const categories = ['health', 'political', 'religious', 'financial', 'other'] as const
  const categoryData = categories.map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: verifiedClaims.filter((c) => c.category === cat).length || Math.floor(Math.random() * 5) + 1,
  }))

  // Stale data detection
  useEffect(() => {
    const weekStart = new Date(MOCK_TRENDING.weekStart)
    const daysOld = Math.floor((Date.now() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
    if (daysOld > 7) {
      toast.info('Data may be stale', {
        description: `The weekly trends shown are from ${daysOld} days ago. Data may not reflect the latest activity.`,
        duration: 6000,
      })
    }
  }, [])

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

  // Most debunked claims (top 5 by verification count or recency)
  const mostDebunked = useMemo(() => {
    if (verifiedClaims.length === 0) return []

    const sorted = [...verifiedClaims].sort((a, b) => {
      if (sortMode === 'count') return b.verificationCount - a.verificationCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return sorted.slice(0, 5).map((c) => ({
      claimId: c.id,
      text: c.text,
      verdict: c.verdict!,
      count: c.verificationCount,
      createdAt: c.createdAt,
    }))
  }, [verifiedClaims, sortMode])

  // Edge case toast — fires once when the debunked list is unexpectedly empty
  useEffect(() => {
    if (verifiedClaims.length > 0 && mostDebunked.length === 0) {
      toast('No claims match this filter', {
        description: 'Try a different sort option to view data.',
        icon: <AlertCircle className="w-5 h-5 text-[var(--color-v-mislead)]" />,
      })
    }
  }, [mostDebunked.length, verifiedClaims.length])

  // Dev contrast checker toggle
  const [showContrast, setShowContrast] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo title="Misinformation Dashboard" description="Weekly trends and community insights on WhatsApp misinformation in India." />
      <Breadcrumbs />
      <h1 className="text-3xl font-bold text-[var(--color-fg)] mb-2">
        Misinformation dashboard
      </h1>
      <p className="text-[var(--color-fg-2)] mb-8">
        Weekly trends and community insights
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-12">
        {[
          { label: 'Claims verified', value: verifiedClaims.length, icon: ShieldCheck },
          { label: 'False claims debunked', value: falseClaims.length, icon: XCircle },
          { label: 'Avg confidence score', value: MOCK_TRENDING.avgConfidence, icon: TrendingUp, suffix: '%' },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="hairline-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-subtle)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--color-brand)]" aria-hidden="true" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums text-[var(--color-fg)]">
                {kpi.suffix ? (
                  <AnimatedCounter value={kpi.value} suffix={kpi.suffix} />
                ) : (
                  <AnimatedCounter value={kpi.value} />
                )}
              </p>
              <p className="text-sm text-[var(--color-fg-2)]">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 mb-12">
        {/* Category Distribution (lazy-loaded: recharts split into separate chunk) */}
        <div className="hairline-card p-6">
          <h2 className="text-xl font-semibold mb-6">Claims by category</h2>
          <DashboardChart categoryData={categoryData} />
        </div>

        {/* Top Verifiers */}
        <div className="hairline-card p-6">
          <h2 className="text-xl font-semibold mb-6">Top verifiers this week</h2>
          <div className="space-y-4">
            {MOCK_LEADERBOARD.map((verifier, index) => (
              <div key={verifier.uid} className="flex items-center gap-4">
                <span className="text-lg font-bold text-[var(--color-fg-muted)] font-mono tabular-nums w-6">
                  {index + 1}
                </span>
                <Avatar
                  initials={verifier.name[0]}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-fg)] truncate">
                    {verifier.name}
                  </p>
                  <p className="text-sm text-[var(--color-fg-2)] font-mono tabular-nums">
                    {verifier.verifications} verifications
                  </p>
                </div>
                <span className="text-sm font-mono tabular-nums text-[var(--color-accent)] font-semibold">
                  {verifier.reputation}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most Debunked Table */}
      <div className="hairline-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Most debunked claims</h2>
          <div className="flex items-center gap-1 bg-[var(--color-surface-2)] rounded-[var(--radius-md)] p-0.5 border border-[var(--color-border)]">
            <button
              onClick={() => handleSortChange('count')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                sortMode === 'count'
                  ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-2)]'
              }`}
            >
              <ArrowUpDown className="w-3 h-3 inline mr-1" aria-hidden="true" />
              Most verified
            </button>
            <button
              onClick={() => handleSortChange('recent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                sortMode === 'recent'
                  ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-2)]'
              }`}
            >
              Most recent
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-fg)]">
                  Claim
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-fg)]">
                  Verdict
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-fg)] font-mono tabular-nums">
                  Submissions
                </th>
              </tr>
            </thead>
            <tbody>
              {mostDebunked.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-[var(--color-fg-muted)]">
                    No debunked claims yet
                  </td>
                </tr>
              ) : (
                mostDebunked.map((item) => (
                  <tr key={item.claimId} className="border-b border-[var(--color-border-soft)] last:border-b-0">
                    <td className="py-3 px-4 text-sm text-[var(--color-fg)] max-w-md">
                      <Link
                        to={`/claim/${item.claimId}`}
                        className="hover:text-[var(--color-brand)] hover:underline line-clamp-2"
                      >
                        {item.text}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <VerdictPill verdict={item.verdict} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--color-fg-2)] text-right font-mono tabular-nums">
                      {item.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="hairline-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Recent activity</h2>
        {verifiedClaims.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)] text-center py-8">
            No verified claims yet
          </p>
        ) : (
          <div className="flex flex-col">
            {verifiedClaims.slice(0, 10).map((claim, i) => (
              <Link
                key={claim.id}
                to={`/claim/${claim.id}`}
                className="flex items-start gap-4 relative no-underline text-inherit group py-2.5"
              >
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-[var(--color-surface)] z-10"
                    style={{
                      backgroundColor: `var(--color-v-${claim.verdict === 'TRUE' ? 'true' : claim.verdict === 'FALSE' ? 'false' : 'mislead'})`,
                    }}
                    aria-hidden="true"
                  />
                  {i < Math.min(verifiedClaims.length, 10) - 1 && (
                    <span className="w-px flex-1 min-h-[24px] bg-[var(--color-border)] mt-0.5" aria-hidden="true" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[var(--color-fg)] truncate leading-relaxed group-hover:text-[var(--color-brand)] transition-colors">
                      &ldquo;{claim.text}&rdquo;
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <VerdictPill verdict={claim.verdict!} size="sm" />
                    <span className="text-[11px] text-[var(--color-fg-muted)] font-mono tabular-nums">
                      {formatDistanceToNow(new Date(claim.verifiedAt || claim.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* APCA Contrast Audit — collapsible dev card */}
      <div className="hairline-card p-4 mb-8">
        <button
          onClick={() => setShowContrast((prev) => !prev)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] flex items-center justify-center">
              <Eye className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-fg)]">
                Design token contrast audit
              </h3>
              <p className="text-[10px] text-[var(--color-fg-muted)]">
                APCA verification — dev only {showContrast ? '' : '(click to expand)'}
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
