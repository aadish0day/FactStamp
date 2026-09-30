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
  addNotification: (input: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void
  isLoading: boolean
}

const defaultNotificationsContext: NotificationsContextValue = {
  notifications: [],
  markRead: async () => {},
  markAllRead: async () => {},
  addNotification: () => {},
  isLoading: false,
}

const NotificationsContext = createContext<NotificationsContextValue>(defaultNotificationsContext)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (isFirebaseConfigured) return []
    try {
      const saved = localStorage.getItem('fs_notifications')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  // Only the offline demo persists locally. With Firebase these are a signed-in
  // user's private notifications, and writing them here left them on disk for
  // whoever used the browser next.
  useEffect(() => {
    if (isFirebaseConfigured) {
      // Also clears what earlier versions left behind.
      try {
        localStorage.removeItem('fs_notifications')
      } catch {
      }
      return
    }
    try {
      localStorage.setItem('fs_notifications', JSON.stringify(notifications))
    } catch {
      // ignore quota limits
    }
  }, [notifications])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    // Clear on sign-out and on account switch, so the previous user's
    // notifications never show under the next one while the snapshot loads.
    setNotifications([])
    if (!uid) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const unsub = subscribeNotificationsRealtime(
      uid,
      (firestoreNotifications) => {
        if (firestoreNotifications) {
          setNotifications(firestoreNotifications)
        }
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )

    return () => unsub()
    // Keyed on uid: `user` changes on every profile snapshot (e.g. a reputation
    // award), which tore down and rebuilt this subscription each time.
  }, [uid])

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
