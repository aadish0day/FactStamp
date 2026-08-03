import { memo } from 'react'
import { Heart, Landmark, BookOpen, DollarSign, MoreHorizontal, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import type { ClaimCategory } from '@/lib/types'

const CATEGORY_CONFIG: Record<
  ClaimCategory,
  { label: string; icon: LucideIcon; variant: BadgeVariant }
> = {
  health: { label: 'Health', icon: Heart, variant: 'error' },
  political: { label: 'Political', icon: Landmark, variant: 'info' },
  religious: { label: 'Religious', icon: BookOpen, variant: 'warning' },
  financial: { label: 'Financial', icon: DollarSign, variant: 'success' },
  other: { label: 'Other', icon: MoreHorizontal, variant: 'default' },
}

interface CategoryBadgeProps {
  category: ClaimCategory
  className?: string
}

export const CategoryBadge = memo(function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category]
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      size="sm"
      icon={<Icon className="w-3 h-3" aria-hidden="true" />}
      className={className}
    >
      {config.label}
    </Badge>
  )
})
