import { memo } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { VerdictStamp } from '@/components/VerdictStamp'
import type { Claim } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/utils'

interface ClaimCardProps {
  claim: Claim
  to: string
  className?: string
}

export const ClaimCard = memo(function ClaimCard({ claim, to, className }: ClaimCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'hairline-card p-6 block no-underline text-inherit transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <CategoryBadge category={claim.category} />
        <time className="text-xs text-[var(--color-fg-muted)] font-mono tabular-nums">
          {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
        </time>
      </div>

      {/* Claim Text */}
      <p className="text-sm text-[var(--color-fg)] line-clamp-3 mb-4 leading-relaxed">
        {claim.text}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {claim.verdict && <VerdictStamp verdict={claim.verdict} size="sm" />}
          {claim.verdict ? (
            <VerdictPill verdict={claim.verdict} size="sm" />
          ) : (
            <span className="text-xs text-[var(--color-fg-muted)] font-medium">
              {claim.verificationCount === 0
                ? 'Awaiting verification'
                : `${claim.verificationCount}/3 verifications`}
            </span>
          )}
        </div>

        {claim.confidenceScore !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent)]"
                style={{ width: `${claim.confidenceScore}%` }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums text-[var(--color-fg-2)]">
              {claim.confidenceScore}%
            </span>
          </div>
        )}
      </div>
    </Link>
  )
})
