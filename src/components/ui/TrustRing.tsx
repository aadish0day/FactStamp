import { cn } from '@/lib/utils'

interface TrustRingProps {
  reputation: number
  size?: number
  showValue?: boolean
  imageUrl?: string
  initials?: string
  className?: string
}

export function TrustRing({
  reputation,
  size = 48,
  showValue = false,
  imageUrl,
  initials,
  className,
}: TrustRingProps) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, reputation)) / 100
  const strokeDashoffset = circumference * (1 - progress)

  // Color shift: low rep uses accent (teal), high rep (>=75) uses brand (saffron)
  const strokeColor = reputation >= 75 ? 'var(--color-brand)' : 'var(--color-accent)'

  return (
    <div
      className={cn('relative inline-block flex-shrink-0 @container', className)}
      style={{ width: size, height: size }}
    >
      {/* Background ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-soft)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 400ms ease-out, stroke 400ms ease-out' }}
        />
      </svg>

      {/* Avatar / Reputation Value */}
      <div
        className="absolute inset-0 m-auto rounded-full overflow-hidden bg-[var(--color-surface-2)] flex items-center justify-center text-xs font-semibold font-mono tabular-nums text-[var(--color-fg)]"
        style={{ width: size - 8, height: size - 8 }}
      >
        {showValue ? (
          <span>{reputation}</span>
        ) : imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  )
}