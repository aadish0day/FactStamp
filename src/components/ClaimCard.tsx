import { memo, useState, useRef } from 'react'
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
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <Link
      ref={cardRef}
      to={to}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative hairline-card p-6 block no-underline text-inherit overflow-hidden transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-brand)]/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, var(--color-brand-subtle), transparent 70%)`,
        }}
      />
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
