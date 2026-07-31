import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, type, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'w-full min-h-[44px] px-4 py-3 rounded-[var(--radius-md)]',
            'bg-[var(--color-surface)] border text-[var(--color-fg)]',
            'font-sans text-base',
            'placeholder:text-[var(--color-fg-soft)]',
            'transition-[border-color,box-shadow] duration-200',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-[var(--color-v-false)] focus:border-[var(--color-v-false)] focus:ring-[var(--color-v-false-bg)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-subtle)]',
            'disabled:bg-[var(--color-surface-2)] disabled:opacity-60 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full min-h-[120px] px-4 py-3 rounded-[var(--radius-md)]',
          'bg-[var(--color-surface)] border text-[var(--color-fg)]',
          'font-sans text-base resize-y',
          'placeholder:text-[var(--color-fg-soft)]',
          'transition-[border-color,box-shadow] duration-200',
          'focus:outline-none focus:ring-2',
          error
            ? 'border-[var(--color-v-false)] focus:border-[var(--color-v-false)] focus:ring-[var(--color-v-false-bg)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-subtle)]',
          'disabled:bg-[var(--color-surface-2)] disabled:opacity-60 disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'
