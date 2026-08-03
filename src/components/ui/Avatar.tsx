import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const dotSizeClasses = {
  sm: 'w-2.5 h-2.5 border-[1.5px] right-0 bottom-0',
  md: 'w-3.5 h-3.5 border-2 right-0 bottom-0',
  lg: 'w-4 h-4 border-2 right-0.5 bottom-0.5',
  xl: 'w-5 h-5 border-[3px] right-0.5 bottom-0.5',
}

export function Avatar({ src, alt = '', initials, size = 'md', online, className }: AvatarProps) {
  const avatar = src ? (
    <img
      src={src}
      alt={alt}
      className={cn(
        'rounded-full object-cover flex-shrink-0 bg-[var(--color-surface-2)]',
        sizeClasses[size],
        className
      )}
    />
  ) : (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        'bg-[var(--color-brand)]',
        sizeClasses[size],
        className
      )}
      aria-label={alt || initials || 'Anonymous'}
      role="img"
    >
      <span aria-hidden="true">{initials || '?'}</span>
    </div>
  )

  // When no online status is provided, render the avatar directly
  if (online === undefined) return avatar

  return (
    <span className="relative inline-flex flex-shrink-0">
      {avatar}
      <span
        className={cn(
          'absolute rounded-full border-[var(--color-surface)]',
          dotSizeClasses[size],
          online
            ? 'bg-[var(--color-v-true)]'
            : 'bg-[var(--color-fg-muted)]'
        )}
        aria-label={online ? 'Online' : 'Offline'}
        role="status"
      />
    </span>
  )
}
