import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, ClipboardCheck, Star, BarChart3, Scale, Check, Sparkles, ExternalLink, X, type LucideIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export interface NotificationItem {
  id: string
  type: 'claim_verified' | 'reputation_update' | 'weekly_report' | 'verdict_submitted'
  title: string
  message: string
  createdAt: string
  isRead: boolean
  claimId?: string
  badgeText?: string
  badgeColor?: string
}

const TYPE_CONFIG: Record<
  NotificationItem['type'],
  { icon: LucideIcon; color: string; bgColor: string }
> = {
  claim_verified: {
    icon: ClipboardCheck,
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.12)',
  },
  reputation_update: {
    icon: Star,
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
  },
  weekly_report: {
    icon: BarChart3,
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
  },
  verdict_submitted: {
    icon: Scale,
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.12)',
  },
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'claim_verified',
    title: 'Consensus Reached: FALSE',
    message: 'Claim #c1 has reached 3 verifications and reached a final consensus verdict.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    claimId: 'c1',
    badgeText: 'DEBUNKED',
    badgeColor: '#dc2626',
  },
  {
    id: 'n2',
    type: 'reputation_update',
    title: 'Reputation Score Boost',
    message: 'Your reputation score increased (+5) for casting an accurate consensus verdict.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isRead: false,
    badgeText: '+5 REP',
    badgeColor: '#16a34a',
  },
  {
    id: 'n3',
    type: 'weekly_report',
    title: 'Weekly Misinfo Digest',
    message: 'Weekly community report is ready. 42 WhatsApp claims debunked this week across India.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isRead: true,
    claimId: 'c2',
    badgeText: 'DIGEST',
    badgeColor: '#ea580c',
  },
]

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [open, setOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead
    return true
  })

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
    if (n.claimId) {
      navigate(`/claim/${n.claimId}`)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative p-2.5 rounded-[var(--radius-md)] text-[var(--color-fg-2)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] cursor-pointer select-none"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-mono font-bold text-white bg-[var(--color-brand)] rounded-full animate-pop-in shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[var(--radius-xl)] bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-border)] shadow-[var(--shadow-xl)] z-50 overflow-hidden animate-dropdown-slide"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border-soft)]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[var(--color-fg)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-[var(--color-brand)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-4 py-2 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/40 gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer',
                activeFilter === 'all'
                  ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer',
                activeFilter === 'unread'
                  ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                  : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--color-fg-muted)]">
              <BellOff className="w-7 h-7 mb-2 text-[var(--color-fg-muted)]" />
              <p className="font-semibold text-[var(--color-fg)]">No notifications here</p>
              <p className="text-[11px] text-[var(--color-fg-muted)] mt-0.5">You&apos;re all caught up with your fact-checking alerts!</p>
            </div>
          ) : (
            <div className="max-h-84 overflow-y-auto divide-y divide-[var(--color-border-soft)]">
              {filteredNotifications.map((n) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.claim_verified
                const Icon = config.icon

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      'flex items-start gap-3.5 w-full p-4 text-left transition-all cursor-pointer relative group',
                      n.isRead
                        ? 'bg-transparent hover:bg-[var(--color-surface-2)]/60'
                        : 'bg-[var(--color-brand-subtle)]/30 hover:bg-[var(--color-surface-2)]'
                    )}
                  >
                    {/* Unread indicator dot */}
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] absolute left-2 top-5 shadow-xs" />
                    )}

                    <div
                      className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs"
                      style={{ backgroundColor: config.bgColor, color: config.color }}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[var(--color-fg)] truncate">
                          {n.title}
                        </span>
                        {n.badgeText && (
                          <span
                            className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase"
                            style={{
                              backgroundColor: `${n.badgeColor}18`,
                              color: n.badgeColor,
                              border: `1px solid ${n.badgeColor}30`,
                            }}
                          >
                            {n.badgeText}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-fg-2)] leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <span className="text-[10px] text-[var(--color-fg-muted)] font-mono tabular-nums">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-brand)] group-hover:underline flex items-center gap-0.5">
                          View <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
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
