import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { SourceQuality } from '@/lib/types'

const QUALITY_CONFIG: Record<SourceQuality, { color: string; label: string }> = {
  high: { color: 'var(--color-sq-high)', label: 'High quality source' },
  medium: { color: 'var(--color-sq-med)', label: 'Credible source' },
  low: { color: 'var(--color-sq-low)', label: 'Unverified source' },
}

interface SourceQualityDotProps {
  quality: SourceQuality
  sourceUrl?: string
  className?: string
}

export const SourceQualityDot = memo(function SourceQualityDot({ quality, sourceUrl, className }: SourceQualityDotProps) {
  const config = QUALITY_CONFIG[quality]

  const dot = (
    <span
      className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0 transition-transform hover:scale-125', className)}
      style={{ backgroundColor: config.color }}
      aria-label={config.label}
      title={config.label}
    />
  )

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] rounded-sm"
        title={`Source (${config.label}): ${sourceUrl}`}
      >
        {dot}
      </a>
    )
  }

  return dot
})
