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
