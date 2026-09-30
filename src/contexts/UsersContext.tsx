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

    // /users is readable only by the owner or an admin (see firestore.rules), so
    // only subscribe for admins. Non-admins would just get permission-denied.
    if (!user?.isAdmin) {
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
  }, [user?.uid, user?.isAdmin])

  // Writes go to Firestore first and the realtime subscription above delivers
  // the committed values. These used to merge optimistically and swallow the
  // rejection, so /admin reported "Admin role granted" (and wrote an audit log)
  // for changes the rules refused. Rejections now reach the caller.
  const adminUpdateUser = useCallback(
    async (uid: string, updates: Partial<User>) => {
      if (isFirebaseConfigured) {
        await adminUpdateUserDoc(uid, updates)
        return
      }
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u))
      )
    },
    []
  )

  const adminDeleteUser = useCallback(
    async (uid: string) => {
      if (isFirebaseConfigured) {
        await deleteUserFromFirestore(uid)
        return
      }
      setUsers((prev) => prev.filter((u) => u.uid !== uid))
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

