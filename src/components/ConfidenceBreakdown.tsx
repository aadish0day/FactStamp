interface ConfidenceBreakdownProps {
  agreementRatio: number
  avgReputation: number
  sourceQuality: number
}

export function ConfidenceBreakdown({
  agreementRatio,
  avgReputation,
  sourceQuality,
}: ConfidenceBreakdownProps) {
  const items = [
    { label: 'Verifier agreement', value: agreementRatio, weight: '40%' },
    { label: 'Avg verifier reputation', value: avgReputation, weight: '30%' },
    { label: 'Source quality', value: sourceQuality, weight: '30%' },
  ]

  return (
    <div className="hairline-card p-6">
      <h3 className="font-semibold mb-4">Confidence breakdown</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-[var(--color-fg)]">{item.label}</span>
              <span className="text-xs font-mono tabular-nums text-[var(--color-fg-muted)]">
                {item.weight} weight
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                />
              </div>
              <span className="text-sm font-mono tabular-nums font-medium text-[var(--color-fg)] min-w-[3ch] text-right">
                {Math.round(item.value)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
