import { memo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import { VERDICT_META, type Verdict } from '@/lib/types'

const VERDICT_ICONS: Record<Verdict, LucideIcon> = {
  TRUE: CheckCircle2,
  FALSE: XCircle,
  MISLEADING: AlertTriangle,
  UNVERIFIABLE: HelpCircle,
  CONTESTED: RefreshCw,
}

interface VerdictStampProps {
  verdict: Verdict
  confidenceScore?: number
  /** When true, the stamp renders flat (no tilt animation) — useful for
   * share-card exports and other contexts where rotated text would be
   * inappropriate. */
  noTilt?: boolean
  /**
   * When provided, replaces the confidence score section entirely with this
   * custom label (e.g. "Pending consensus"). Useful for pre-consensus preview
   * states where no score exists yet.
   */
  confidenceLabel?: string
  /**
   * 'xs' — tiny single-ring seal for badge/pill embedding (~16px).
   * 'sm' — compact double-ring seal for card embedding (~40px).
   * 'md' — full double-ring seal with label + confidence score (default).
   */
  size?: 'xs' | 'sm' | 'md'
}

export const VerdictStamp = memo(function VerdictStamp({ verdict, confidenceScore, noTilt, confidenceLabel, size = 'md' }: VerdictStampProps) {
  const meta = VERDICT_META[verdict]
  const Icon = VERDICT_ICONS[verdict]
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (size === 'xs' || size === 'sm') {
      setHasAnimated(true)
      return
    }
    const timer = setTimeout(() => setHasAnimated(true), noTilt ? 50 : 100)
    return () => clearTimeout(timer)
  }, [noTilt, size])

  // ── Extra-small variant: single-ring seal for badge/pill embedding ──
  if (size === 'xs') {
    return (
      <div
        className="w-[16px] h-[16px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: `var(${meta.colorVar})`,
          backgroundColor: `var(${meta.bgVar})`,
        }}
      >
        <Icon className="w-[7px] h-[7px]" style={{ color: `var(${meta.colorVar})` }} aria-hidden="true" />
      </div>
    )
  }

  // ── Compact variant: double-ring seal for card embedding ──
  if (size === 'sm') {
    return (
      <div
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: `var(${meta.colorVar})`,
          backgroundColor: `var(${meta.bgVar})`,
        }}
      >
        <div
          className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center"
          style={{ borderColor: `var(${meta.colorVar})` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: `var(${meta.colorVar})` }} aria-hidden="true" />
        </div>
      </div>
    )
  }

  // ── Full variant: double-ring seal + label + confidence ──
  return (
    <div
      className={cn(
        'relative inline-flex flex-col items-center gap-4 p-8',
        noTilt
          ? (hasAnimated ? 'animate-fade-in' : 'opacity-0')
          : hasAnimated && 'animate-stamp-bounce'
      )}
    >
      {/* Circular seal — double-ring border (solid outer, dashed inner) */}
      <div
        className="w-56 h-56 rounded-full border-[3px] flex items-center justify-center"
        style={{
          borderColor: `var(${meta.colorVar})`,
          backgroundColor: `var(${meta.bgVar})`,
          boxShadow: `0 0 30px ${meta.thudColor}`,
        }}
      >
        <div
          className="w-44 h-44 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-3"
          style={{ borderColor: `var(${meta.colorVar})` }}
        >
          <Icon className="w-14 h-14" style={{ color: `var(${meta.colorVar})` }} aria-hidden="true" />
          <span
            className="text-xl font-bold uppercase tracking-tight leading-tight text-center"
            style={{ color: `var(${meta.colorVar})` }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Confidence Score / Custom Label */}
      <div className="text-center">
        {confidenceLabel ? (
          <p className="text-sm font-medium text-[var(--color-fg-muted)] tracking-wide">
            {confidenceLabel}
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--color-fg-2)] mb-1">Confidence score</p>
            <p className="text-4xl font-bold font-mono tabular-nums">
              {confidenceScore ?? '—'}%
            </p>
          </>
        )}
      </div>
    </div>
  )
})
