import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeUsersRealtime } from '@/services/firebaseService'

interface UsersContextValue {
  users: User[]
  isLoading: boolean
}

const defaultUsersContext: UsersContextValue = {
  users: [],
  isLoading: false,
}

const UsersContext = createContext<UsersContextValue>(defaultUsersContext)

/**
 * Realtime view of the Firestore `users` collection (Verifier Profiles),
 * ordered by reputation. Reads require a signed-in user (see firestore.rules),
 * so the subscription is only active when Firebase is configured AND a user is
 * authenticated — the collection is otherwise left empty.
 */
export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured || !user) {
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
      () => setIsLoading(false)
    )

    return () => unsub()
  }, [user])

  return (
    <UsersContext.Provider value={{ users, isLoading }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  return context || defaultUsersContext
}
