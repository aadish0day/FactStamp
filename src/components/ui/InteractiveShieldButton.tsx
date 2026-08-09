import React from 'react'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InteractiveShieldButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  badgeCount?: number
}

export const InteractiveShieldButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveShieldButtonProps
>(({ text = 'Explore Verification Queue', badgeCount, className, children, ...props }, ref) => {
  const labelText = children || text

  return (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2.5 min-h-[44px] px-6 py-2.5 cursor-pointer rounded-full',
        'border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold text-xs sm:text-sm text-[var(--color-fg)] shadow-[var(--shadow-sm)]',
        'transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        'hover:bg-[var(--color-surface-2)] hover:border-[var(--color-brand)]/40 hover:shadow-[0_4px_16px_var(--color-brand-subtle)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'touch-manipulation select-none whitespace-nowrap',
        className
      )}
      {...props}
    >
      {/* Icon Badge Container */}
      <div className="w-6 h-6 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0 border border-[var(--color-brand-subtle)] group-hover:scale-110 group-hover:border-[var(--color-brand)]/30 transition-all duration-300">
        <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-brand)] transition-transform duration-300" aria-hidden="true" />
      </div>

      {/* Button Text */}
      <span className="transition-colors duration-300 group-hover:text-[var(--color-fg)]">
        {labelText}
      </span>

      {/* Optional Badge Count */}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand-subtle)]">
          {badgeCount}
        </span>
      )}

      {/* Animated Trailing Arrow */}
      <ArrowRight
        className="w-4 h-4 text-[var(--color-brand)] flex-shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
        aria-hidden="true"
      />
    </button>
  )
})

InteractiveShieldButton.displayName = 'InteractiveShieldButton'

export default InteractiveShieldButton
