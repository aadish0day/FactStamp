import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = 'Button', className, children, ...props }, ref) => {
  const labelText = children || text

  return (
    <button
      ref={ref}
      className={cn(
        'group relative inline-flex items-center justify-center min-h-[44px] min-w-[140px] px-6 py-2.5 cursor-pointer overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] font-semibold text-xs sm:text-sm text-[var(--color-fg)] shadow-[var(--shadow-sm)] transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        'touch-manipulation',
        className
      )}
      {...props}
    >
      {/* Expanding Dot Background */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[var(--color-brand)] transition-all duration-500 ease-out group-hover:scale-[35] z-0" />

      {/* Rest State Label */}
      <div className="relative z-10 flex items-center gap-2 pl-3 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        <span>{labelText}</span>
      </div>

      {/* Hover State Label with Arrow */}
      <div className="absolute inset-0 z-20 flex h-full w-full translate-x-10 items-center justify-center gap-2 text-[var(--color-brand-fg)] font-semibold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{labelText}</span>
        <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      </div>
    </button>
  )
})

InteractiveHoverButton.displayName = 'InteractiveHoverButton'

export default InteractiveHoverButton
