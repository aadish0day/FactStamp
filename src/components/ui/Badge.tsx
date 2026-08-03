import { memo } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'brand'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface-2)] text-[var(--color-fg-2)] border-[var(--color-border)]',
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] border-[var(--color-border-soft)]',
  success: 'bg-[var(--color-v-true-bg)] text-[var(--color-v-true)] border-[var(--color-v-true-border)]',
  warning: 'bg-[var(--color-v-mislead-bg)] text-[var(--color-v-mislead)] border-[var(--color-v-mislead-border)]',
  error: 'bg-[var(--color-v-false-bg)] text-[var(--color-v-false)] border-[var(--color-v-false-border)]',
  info: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent)]',
  brand: 'bg-[var(--color-brand-subtle,rgba(224,86,36,0.1))] text-[var(--color-brand)] border-[var(--color-brand)]',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
}

export const Badge = memo(function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[var(--radius-sm)] border select-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  )
})
