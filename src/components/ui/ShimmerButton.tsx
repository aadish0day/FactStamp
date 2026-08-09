import React from 'react'
import { cn } from '@/lib/utils'

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  className?: string
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 h-11 px-6 py-2.5 rounded-full font-semibold text-sm sm:text-base select-none cursor-pointer overflow-hidden',
        'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]',
        'transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100',
        'touch-manipulation',
        className
      )}
      {...props}
    >
      {/* 21st Shimmer Animated Highlight */}
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,35%,var(--color-brand-subtle),50%,transparent,65%)] bg-[length:200%_100%] animate-[shimmer2_2.5s_infinite_linear] opacity-70 group-hover:opacity-100 transition-opacity"
        aria-hidden="true"
      />

      {/* Subtle border glow on hover */}
      <span
        className="pointer-events-none absolute -inset-px rounded-full border border-[var(--color-brand)]/0 group-hover:border-[var(--color-brand)]/40 transition-colors duration-300"
        aria-hidden="true"
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  )
})

ShimmerButton.displayName = 'ShimmerButton'

export default ShimmerButton
