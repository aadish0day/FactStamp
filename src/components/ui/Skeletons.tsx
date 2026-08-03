export function ClaimCardSkeleton() {
  return (
    <div className="hairline-card p-6 animate-shimmer" aria-hidden="true">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-20 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]" />
        <div className="h-4 w-16 rounded bg-[var(--color-surface-2)]" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full rounded bg-[var(--color-surface-2)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--color-surface-2)]" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]" />
        <div className="h-2 w-20 rounded-full bg-[var(--color-surface-2)]" />
      </div>
    </div>
  )
}

export function NotificationListSkeleton() {
  return (
    <div className="p-2 animate-shimmer" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3.5 p-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex-shrink-0" />
          <div className="flex-1 min-w-0 pt-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-[var(--color-surface-2)]" />
            <div className="h-3 w-full rounded bg-[var(--color-surface-2)]" />
            <div className="h-2.5 w-2/3 rounded bg-[var(--color-surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ClaimDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-shimmer space-y-6">
        <div className="hairline-card p-6">
          <div className="h-5 w-20 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] mb-4" />
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full rounded bg-[var(--color-surface-2)]" />
            <div className="h-4 w-full rounded bg-[var(--color-surface-2)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--color-surface-2)]" />
          </div>
          <div className="flex justify-center py-8">
            <div className="w-48 h-32 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]" />
          </div>
        </div>
      </div>
    </div>
  )
}
