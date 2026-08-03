import { memo } from 'react'
import { Badge, type BadgeVariant, type BadgeSize } from '@/components/ui/Badge'
import { VerdictStamp } from '@/components/VerdictStamp'
import { VERDICT_META, type Verdict } from '@/lib/types'

/** Verdicts that map cleanly to a Badge variant share the same CSS variables */
const VERDICT_BADGE_VARIANT: Partial<Record<Verdict, BadgeVariant>> = {
  TRUE: 'success',
  FALSE: 'error',
  MISLEADING: 'warning',
}

interface VerdictPillProps {
  verdict: Verdict
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const VerdictPill = memo(function VerdictPill({ verdict, size = 'md', className }: VerdictPillProps) {
  const meta = VERDICT_META[verdict]

  const badgeSize: BadgeSize = size
  const variant = VERDICT_BADGE_VARIANT[verdict]

  // UNVERIFIABLE / CONTESTED use their own CSS var pairs, so pass via style
  const customStyle = !variant
    ? ({
        backgroundColor: `var(${meta.bgVar})`,
        borderColor: `var(${meta.borderVar})`,
        color: `var(${meta.colorVar})`,
      } as React.CSSProperties)
    : undefined

  return (
    <Badge
      variant={variant ?? 'neutral'}
      size={badgeSize}
      icon={<VerdictStamp verdict={verdict} size="xs" />}
      className={className}
      style={customStyle}
    >
      <span className="font-semibold">{meta.label}</span>
    </Badge>
  )
})
