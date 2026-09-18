import type { Claim } from './types'

interface WeeklyCategoryCount {
  category: string
  count: number
}

interface WeeklyVerifierStat {
  name: string
  verifications: number
  /**
   * Share of this verifier's verdicts that match the claim's final verdict.
   * Since the same verdicts form that consensus, it reads high by construction —
   * it measures agreement with the group, not correctness. Labelled "agreed" in
   * the UI for that reason.
   */
  accuracy: number
}

export interface WeeklyReport {
  weekLabel: string
  weekStart: Date
  weekEnd: Date
  weeklyClaimCount: number
  /**
   * 'week' when the figures below cover the last 7 days. Falls back to 'all'
   * when nothing was submitted this week, so the UI can say which it is
   * instead of labelling all-time totals as weekly.
   */
  scope: 'week' | 'all'
  categoryCounts: WeeklyCategoryCount[]
  debunkedClaims: Claim[]
  topVerifiers: WeeklyVerifierStat[]
}

const CATEGORY_ORDER = ['health', 'political', 'religious', 'financial', 'other'] as const

/**
 * Compute the weekly trending misinformation report from the claims
 * collection. Purely client-side (mirrors what a Vercel Cron would compute and
 * persist server-side): categories with the most submissions this week, the
 * five most-debunked claims, and top verifiers ranked by verification count
 * then accuracy (matches against the final consensus verdict).
 */
export function computeWeeklyReport(claims: Claim[]): WeeklyReport {
  const now = new Date()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const weekClaims = claims.filter((c) => {
    const d = new Date(c.createdAt)
    return d >= weekStart && d <= weekEnd
  })

  // Use the 7-day window when it has claims, otherwise report on all claims
  // (and say so via `scope`) rather than showing an empty panel.
  const scope: 'week' | 'all' = weekClaims.length > 0 ? 'week' : 'all'
  const targetClaims = weekClaims.length > 0 ? weekClaims : claims

  // 1. Most submitted categories
  const categoryCounts: WeeklyCategoryCount[] = CATEGORY_ORDER.map((category) => ({
    category,
    count: targetClaims.filter((c) => c.category === category).length,
  }))
    .sort((a, b) => b.count - a.count)

  // 2. Five most debunked claims (FALSE or MISLEADING, most verified)
  const debunkedClaims = targetClaims
    .filter(
      (c) =>
        c.status === 'verified' &&
        (c.verdict === 'FALSE' || c.verdict === 'MISLEADING')
    )
    .sort((a, b) => b.verificationCount - a.verificationCount)
    .slice(0, 5)

  // 3. Top verifiers by verification count + accuracy (all-time, since
  //    accuracy needs consensus history to be meaningful)
  const verifierStats = new Map<string, { name: string; total: number; correct: number }>()
  for (const c of claims) {
    if (c.status !== 'verified' || !c.verdict) continue
    for (const v of c.verifications) {
      const stats = verifierStats.get(v.verifierId) ?? {
        name: v.verifierName,
        total: 0,
        correct: 0,
      }
      stats.total += 1
      if (v.verdict === c.verdict) stats.correct += 1
      verifierStats.set(v.verifierId, stats)
    }
  }
  const topVerifiers: WeeklyVerifierStat[] = [...verifierStats.values()]
    .filter((s) => s.total > 0)
    .map((s) => ({
      name: s.name,
      verifications: s.total,
      accuracy: Math.round((s.correct / s.total) * 100),
    }))
    .sort((a, b) => b.verifications - a.verifications || b.accuracy - a.accuracy)
    .slice(0, 5)

  const weekLabel = `${weekStart.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })} – ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`

  return {
    weekLabel,
    weekStart,
    weekEnd,
    weeklyClaimCount: weekClaims.length,
    scope,
    categoryCounts,
    debunkedClaims,
    topVerifiers,
  }
}
