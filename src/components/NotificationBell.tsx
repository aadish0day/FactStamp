import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, ClipboardCheck, Star, BarChart3, Scale, type LucideIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  type: 'claim_verified' | 'reputation_update' | 'weekly_report' | 'verdict_submitted'
  message: string
  createdAt: string
  isRead: boolean
  claimId?: string
}

const TYPE_ICON: Record<NotificationItem['type'], LucideIcon> = {
  claim_verified: ClipboardCheck,
  reputation_update: Star,
  weekly_report: BarChart3,
  verdict_submitted: Scale,
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'claim_verified',
    message: 'Claim #c1 has reached 3 verifications and reached consensus: FALSE',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    claimId: 'c1',
  },
  {
    id: 'n2',
    type: 'reputation_update',
    message: 'Your reputation score increased (+5) for an accurate verdict.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isRead: false,
  },
  {
    id: 'n3',
    type: 'weekly_report',
    message: 'Weekly misinfo digest is ready. 42 claims debunked this week.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isRead: true,
  },
]

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleItemClick = (n: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
    )
    setOpen(false)
    if (n.claimId) navigate(`/claim/${n.claimId}`)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative p-2 rounded-[var(--radius-md)] text-[var(--color-fg-2)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] cursor-pointer"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold font-mono text-white bg-[var(--color-brand)] rounded-full animate-pop-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] z-50 overflow-hidden animate-dropdown-slide"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-soft)]">
            <span className="font-semibold text-sm text-[var(--color-fg)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[var(--color-accent)] hover:underline font-medium cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-[var(--color-fg-muted)]">
              <BellOff className="w-6 h-6 mb-2 text-[var(--color-fg-soft)]" />
              <span>No notifications yet</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border-soft)]">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      'flex items-start gap-3 w-full p-3 text-left transition-colors cursor-pointer',
                      n.isRead
                        ? 'bg-transparent hover:bg-[var(--color-surface-2)]'
                        : 'bg-[var(--color-accent-subtle)] hover:bg-[var(--color-surface-2)]'
                    )}
                  >
                    <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] text-[var(--color-brand)] flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs text-[var(--color-fg)] leading-relaxed', !n.isRead && 'font-semibold')}>
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[var(--color-fg-muted)] font-mono tabular-nums mt-1 block">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
