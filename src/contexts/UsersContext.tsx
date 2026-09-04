import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeUsersRealtime,
  adminUpdateUserDoc,
  deleteUserFromFirestore,
} from '@/services/firebaseService'



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

