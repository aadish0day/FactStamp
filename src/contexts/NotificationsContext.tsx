import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AppNotification } from '@/lib/types'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeNotificationsRealtime,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/firebaseService'

const DEFAULT_SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n_seed_1',
    userId: 'demo',
    title: 'Verdict Consensus Reached',
    message: 'Claim "Drinking boiled ginger water cures Type 2 Diabetes" was debunked as FALSE (94% confidence).',
    type: 'claim_verified',
    claimId: 'c_seed_1',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n_seed_2',
    userId: 'demo',
    title: 'Reputation Awarded',
    message: '+2 Rep points added to your verifier handle for community consensus match.',
    type: 'reputation_update',
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n_seed_3',
    userId: 'demo',
    title: 'Weekly Misinformation Briefing',
    message: 'FactStamp Weekly Digest ready on Dashboard: 12 viral WhatsApp claims debunked in India.',
    type: 'weekly_report',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n_seed_4',
    userId: 'demo',
    title: 'Verdict Submitted',
    message: 'Your verdict for "RBI 18% digital tax on UPI" was recorded into the consensus queue.',
    type: 'verdict_submitted',
    claimId: 'c_seed_2',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

interface NotificationsContextValue {
  notifications: AppNotification[]
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (input: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void
  isLoading: boolean
}

const defaultNotificationsContext: NotificationsContextValue = {
  notifications: DEFAULT_SEED_NOTIFICATIONS,
  markRead: async () => {},
  markAllRead: async () => {},
  addNotification: () => {},
  isLoading: false,
}

const NotificationsContext = createContext<NotificationsContextValue>(defaultNotificationsContext)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('fs_notifications')
      return saved ? JSON.parse(saved) : DEFAULT_SEED_NOTIFICATIONS
    } catch {
      return DEFAULT_SEED_NOTIFICATIONS
    }
  })
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    try {
      localStorage.setItem('fs_notifications', JSON.stringify(notifications))
    } catch {
      // ignore quota limits
    }
  }, [notifications])

  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsub = subscribeNotificationsRealtime(
      user.uid,
      (firestoreNotifications) => {
        if (firestoreNotifications && firestoreNotifications.length > 0) {
          setNotifications(firestoreNotifications)
        }
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )

    return () => unsub()
  }, [user])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    if (isFirebaseConfigured) {
      try {
        await markNotificationRead(id)
      } catch (err) {
        console.warn('Firestore mark-read notice:', err)
      }
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    if (isFirebaseConfigured && user) {
      try {
        await markAllNotificationsRead(user.uid)
      } catch (err) {
        console.warn('Firestore mark-all-read notice:', err)
      }
    }
  }, [user])

  const addNotification = useCallback((input: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...input,
      id: `n_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setNotifications((prev) => [newNotif, ...prev])
  }, [])

  return (
    <NotificationsContext.Provider value={{ notifications, markRead, markAllRead, addNotification, isLoading }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  return context || defaultNotificationsContext
}
