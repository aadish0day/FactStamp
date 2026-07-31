import { subDays, startOfDay, endOfDay } from 'date-fns'
import type { Claim } from './types'

export interface WeeklyCategoryCount {
  category: string
  count: number
}

export interface WeeklyVerifierStat {
  name: string
  verifications: number
  accuracy: number
}

export interface WeeklyReport {
  weekLabel: string
  weekStart: Date
  weekEnd: Date
  weeklyClaimCount: number
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
  const weekStart = startOfDay(subDays(now, 6))
  const weekEnd = endOfDay(now)

  const weekClaims = claims.filter((c) => {
    const d = new Date(c.createdAt)
    return d >= weekStart && d <= weekEnd
  })

  // 1. Most submitted categories for the week
  const categoryCounts: WeeklyCategoryCount[] = CATEGORY_ORDER.map((category) => ({
    category,
    count: weekClaims.filter((c) => c.category === category).length,
  }))
    .sort((a, b) => b.count - a.count)

  // 2. Five most debunked claims this week (FALSE or MISLEADING, most verified)
  const debunkedClaims = weekClaims
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
    categoryCounts,
    debunkedClaims,
    topVerifiers,
  }
}
