import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeUsersRealtime,
  adminUpdateUserDoc,
  deleteUserFromFirestore,
} from '@/services/firebaseService'

const SEED_USERS_FALLBACK: User[] = [
  { uid: 'u101', displayName: 'Priya Sharma', email: 'priya@factstamp.app', reputation: 95, totalVerifications: 112, joinedAt: '2025-01-15T08:00:00Z', isAdmin: true },
  { uid: 'u102', displayName: 'Raj Patel', email: 'raj@factstamp.app', reputation: 94, totalVerifications: 98, joinedAt: '2024-11-03T10:30:00Z' },
  { uid: 'u103', displayName: 'Vikram Singh', email: 'vikram@factstamp.app', reputation: 91, totalVerifications: 84, joinedAt: '2024-09-12T06:45:00Z' },
  { uid: 'u104', displayName: 'Ananya Gupta', email: 'ananya@factstamp.app', reputation: 88, totalVerifications: 62, joinedAt: '2025-03-20T14:00:00Z' },
  { uid: 'u105', displayName: 'Aarav Mehta', email: 'aarav@factstamp.app', reputation: 82, totalVerifications: 45, joinedAt: '2025-04-10T11:15:00Z' },
  { uid: 'u106', displayName: 'Neha Joshi', email: 'neha@factstamp.app', reputation: 78, totalVerifications: 31, joinedAt: '2025-05-01T12:00:00Z' },
  { uid: 'u107', displayName: 'Kavya Nair', email: 'kavya@factstamp.app', reputation: 65, totalVerifications: 19, joinedAt: '2025-06-05T16:20:00Z' },
]

interface UsersContextValue {
  users: User[]
  adminUpdateUser: (uid: string, updates: Partial<User>) => Promise<void>
  adminDeleteUser: (uid: string) => Promise<void>
  isLoading: boolean
}

const defaultUsersContext: UsersContextValue = {
  users: [],
  adminUpdateUser: async () => {},
  adminDeleteUser: async () => {},
  isLoading: false,
}

const UsersContext = createContext<UsersContextValue>(defaultUsersContext)

/**
 * Realtime view of the Firestore `users` collection (Verifier Profiles),
 * ordered by reputation. Reads require a signed-in user (see firestore.rules),
 * so the subscription is only active when Firebase is configured AND a user is
 * authenticated — the collection is otherwise left empty or initialized with seed data.
 */
export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      return
    }

    if (!user) {
      setUsers([])
      setIsLoading(false)
      return
    }

    // Re-arm the loading state on each sign-in so the UI doesn't flash stale
    // data while the fresh subscription is bootstrapping.
    setIsLoading(true)

    const unsub = subscribeUsersRealtime(
      (firestoreUsers) => {
        setUsers(firestoreUsers)
        setIsLoading(false)
      },
      (err) => {
        console.warn('Firestore users realtime listener notice:', err)
        setIsLoading(false)
      }
    )

    return () => unsub()
  }, [user])

  const adminUpdateUser = useCallback(
    async (uid: string, updates: Partial<User>) => {
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
      )
      if (isFirebaseConfigured) {
        try {
          await adminUpdateUserDoc(uid, updates)
        } catch (err) {
          console.warn('Firestore admin user update notice:', err)
        }
      }
    },
    []
  )

  const adminDeleteUser = useCallback(
    async (uid: string) => {
      setUsers((prev) => prev.filter((u) => u.uid !== uid))
      if (isFirebaseConfigured) {
        try {
          await deleteUserFromFirestore(uid)
        } catch (err) {
          console.warn('Firestore admin user delete notice:', err)
        }
      }
    },
    []
  )

  return (
    <UsersContext.Provider value={{ users, adminUpdateUser, adminDeleteUser, isLoading }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  return context || defaultUsersContext
}

