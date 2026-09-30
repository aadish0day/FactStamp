import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

/** Marks a seeded demo claim (or its sample verifiers) so it is never mistaken for real activity. */
export function ExampleBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="neutral"
      className={cn('uppercase tracking-wide flex-shrink-0', className)}
      title="Example claim with sample verifiers, included to show how FactStamp works"
    >
      Example
    </Badge>
  )
}
