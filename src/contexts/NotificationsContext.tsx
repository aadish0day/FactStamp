import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AppNotification } from '@/lib/types'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeNotificationsRealtime,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/firebaseService'

interface NotificationsContextValue {
  notifications: AppNotification[]
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  isLoading: boolean
}

const defaultNotificationsContext: NotificationsContextValue = {
  notifications: [],
  markRead: async () => {},
  markAllRead: async () => {},
  isLoading: false,
}

const NotificationsContext = createContext<NotificationsContextValue>(defaultNotificationsContext)

/**
 * Realtime view of the signed-in user's Firestore `notifications` collection,
 * newest first. Reads are scoped to the authenticated user (see firestore.rules),
 * so the subscription only activates when Firebase is configured AND a user is
 * signed in — the list is otherwise empty.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsub = subscribeNotificationsRealtime(
      user.uid,
      (firestoreNotifications) => {
        setNotifications(firestoreNotifications)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )

    return () => unsub()
  }, [user])

  const markRead = useCallback(async (id: string) => {
    // Optimistic UI update
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

  return (
    <NotificationsContext.Provider value={{ notifications, markRead, markAllRead, isLoading }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  return context || defaultNotificationsContext
}
