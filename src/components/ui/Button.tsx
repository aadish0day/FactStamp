import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const variantClasses = {
  primary:
    'bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)] shadow-[var(--shadow-sm)]',
  accent:
    'bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)] shadow-[var(--shadow-sm)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border)] shadow-[var(--shadow-xs)]',
  ghost:
    'bg-transparent text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]',
  danger:
    'bg-[var(--color-v-false)] text-white hover:brightness-110 shadow-[var(--shadow-sm)]',
  outline:
    'bg-transparent border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)]',
} as const

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm h-8',
  md: 'px-4 py-2 text-sm h-10 min-h-[44px] md:min-h-0',
  lg: 'px-6 py-2.5 text-base h-11',
  icon: 'w-9 h-9 p-0 min-h-[44px] md:min-h-0',
  'icon-sm': 'w-8 h-8 p-0',
  'icon-lg': 'w-11 h-11 p-0 min-h-[44px] md:min-h-0',
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
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)]',
          'font-semibold whitespace-nowrap select-none',
          'transition-transform duration-150 ease-out',
          'active:scale-[0.96]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100',
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
