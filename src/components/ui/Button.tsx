import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const variantClasses = {
  primary:
    'bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] border border-transparent',
  accent:
    'bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] border border-transparent',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-brand)]/40 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
  ghost:
    'bg-transparent text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] border border-transparent',
  danger:
    'bg-[var(--color-v-false)] text-white hover:brightness-110 shadow-[var(--shadow-sm)] border border-transparent',
  outline:
    'bg-transparent border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] shadow-[var(--shadow-xs)]',
} as const

const sizeClasses = {
  sm: 'px-3.5 py-1.5 text-xs h-8 min-h-0 rounded-full',
  md: 'px-5 py-2 text-sm h-10 min-h-[44px] md:min-h-0 rounded-full',
  lg: 'px-6 py-2.5 text-sm sm:text-base h-11 rounded-full',
  icon: 'w-9 h-9 p-0 min-h-[44px] md:min-h-0 rounded-full',
  'icon-sm': 'w-8 h-8 p-0 rounded-full',
  'icon-lg': 'w-11 h-11 p-0 min-h-[44px] md:min-h-0 rounded-full',
} as const

type Variant = keyof typeof variantClasses
type Size = keyof typeof sizeClasses

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none',
          'transition-all duration-200 ease-out cursor-pointer',
          'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100',
          'touch-manipulation',
          variantClasses[intent],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
