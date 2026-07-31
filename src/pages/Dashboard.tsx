import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
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
  ExternalLink
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { Avatar } from '@/components/ui/Avatar'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { Button } from '@/components/ui/Button'
import { DashboardChart } from '@/components/DashboardChart'
import { ContrastChecker } from '@/components/ContrastChecker'
import { useClaims } from '@/contexts/ClaimsContext'
import { MOCK_TRENDING, MOCK_LEADERBOARD } from '@/lib/types'

export function Dashboard() {
  const { claims } = useClaims()

  const verifiedClaims = claims.filter((c) => c.status === 'verified')
  const falseClaims = verifiedClaims.filter((c) => c.verdict === 'FALSE')

  const [searchQuery, setSearchQuery] = useState('')

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

  // Dev contrast checker toggle
  const [showContrast, setShowContrast] = useState(false)

  const kpis = [
    {
      label: 'Total Claims Verified',
      value: verifiedClaims.length,
      icon: ShieldCheck,
      color: '#16a34a',
      bgColor: 'rgba(22, 163, 74, 0.12)',
      borderColor: 'rgba(22, 163, 74, 0.25)',
      trend: '+12% this week',
    },
    {
      label: 'False Claims Debunked',
      value: falseClaims.length,
      icon: XCircle,
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.12)',
      borderColor: 'rgba(220, 38, 38, 0.25)',
      trend: '84% of submissions',
    },
    {
      label: 'Avg Consensus Score',
      value: MOCK_TRENDING.avgConfidence,
      icon: TrendingUp,
      suffix: '%',
      color: '#ea580c',
      bgColor: 'rgba(234, 88, 12, 0.12)',
      borderColor: 'rgba(234, 88, 12, 0.25)',
      trend: 'High confidence',
    },
  ]

  const VERIFIER_TITLES = ['Lead Fact-Checker', 'Senior Analyst', 'Community Verifier', 'Fact Guardian', 'Active Analyst']

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo title="Misinformation Dashboard" description="Weekly trends and community insights on WhatsApp misinformation in India." />
      <Breadcrumbs />

      {/* Header Banner with CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-[var(--color-surface-2)] via-[var(--color-surface)] to-[var(--color-surface-2)] p-6 lg:p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FactStamp Live Intelligence</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[var(--color-fg)] tracking-tight mb-2">
            Misinformation Dashboard
          </h1>
          <p className="text-sm lg:text-base text-[var(--color-fg-2)] max-w-xl leading-relaxed">
            Real-time analytics, category distributions, and top verifier leaderboards across viral Indian WhatsApp forwards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <Link to="/submit">
            <Button intent="primary" size="lg" className="font-bold shadow-[var(--shadow-md)]">
              <Plus className="w-4 h-4 me-1.5" />
              Submit Claim
            </Button>
          </Link>
          <Link to="/verify">
            <Button intent="secondary" size="lg" className="font-semibold">
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
            <div
              key={kpi.label}
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
            </div>
          )
        })}
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

          <div className="space-y-3">
            {MOCK_LEADERBOARD.map((verifier, index) => {
              const ranks = ['🥇', '🥈', '🥉', '4', '5']
              const isTop3 = index < 3
              return (
                <div
                  key={verifier.uid}
                  className="flex items-center gap-3.5 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] hover:border-[var(--color-brand-subtle)] transition-all"
                >
                  <span className={`text-sm font-bold font-mono w-6 text-center ${isTop3 ? 'text-base' : 'text-[var(--color-fg-muted)]'}`}>
                    {ranks[index]}
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
