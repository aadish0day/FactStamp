import React from 'react'
import { ArrowRight, ShieldCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  icon?: LucideIcon
}

export const FlowButton = React.forwardRef<
  HTMLButtonElement,
  FlowButtonProps
>(({ text = 'Explore Verification Queue', icon: Icon, className, children, ...props }, ref) => {
  const labelText = children || text
  const LeftIcon = Icon || ShieldCheck

  return (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[100px] border-[1.5px]',
        'border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-fg)] cursor-pointer',
        'transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'hover:border-transparent hover:text-[var(--color-brand-fg)] hover:rounded-[12px] active:scale-[0.95]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'touch-manipulation select-none whitespace-nowrap shadow-[var(--shadow-sm)]',
        className
      )}
      {...props}
    >
      {/* Left Icon sliding in from left */}
      <LeftIcon
        className="absolute w-4 h-4 left-[-25%] stroke-current fill-none z-[9] group-hover:left-4 group-hover:stroke-[var(--color-brand-fg)] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        aria-hidden="true"
      />

      {/* Text */}
      <span className="relative z-[1] -translate-x-2.5 group-hover:translate-x-3 transition-all duration-[800ms] ease-out">
        {labelText}
      </span>

      {/* Expanding Circle Background */}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[var(--color-brand)] rounded-[50%] opacity-0 group-hover:w-[320px] group-hover:h-[320px] group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
        aria-hidden="true"
      />

      {/* Right Arrow sliding out to right */}
      <ArrowRight
        className="absolute w-4 h-4 right-4 stroke-current fill-none z-[9] group-hover:right-[-25%] group-hover:stroke-[var(--color-brand-fg)] transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        aria-hidden="true"
      />
    </button>
  )
})

FlowButton.displayName = 'FlowButton'

export default FlowButton
