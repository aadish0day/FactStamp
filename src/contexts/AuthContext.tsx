import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import { auth, onAuthStateChanged, isFirebaseConfigured } from '@/lib/firebase'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogleProvider,
  signOutUser,
  resetPassword as resetPasswordService,
  getUserProfile,
  updateUserProfile,
  getAuthErrorMessage,
} from '@/services/firebaseService'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  isLoading: boolean
  isFirebaseConfigured: boolean
}

const defaultAuthContext: AuthContextValue = {
  user: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateUser: async () => {},
  isLoading: false,
  isFirebaseConfigured,
}

const AuthContext = createContext<AuthContextValue>(defaultAuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth state is fully managed by Firebase's onAuthStateChanged.
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  // Restore / track Firebase auth session (only when real keys are present)
  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          setUser(
            profile ?? {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Verifier',
              email: firebaseUser.email || '',
              reputation: 50,
              totalVerifications: 0,
              joinedAt: new Date().toISOString(),
            }
          )
        } catch (err) {
          console.warn('Failed to load verifier profile, using defaults:', err)
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Verifier',
            email: firebaseUser.email || '',
            reputation: 50,
            totalVerifications: 0,
            joinedAt: new Date().toISOString(),
          })
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured')
    setIsLoading(true)
    try {
      const profile = await signInWithEmail(email, password)
      setUser(profile)
    } catch (err) {
      throw new Error(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured')
    setIsLoading(true)
    try {
      const profile = await signInWithGoogleProvider()
      setUser(profile)
    } catch (err) {
      throw new Error(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured')
    setIsLoading(true)
    try {
      const profile = await signUpWithEmail(name, email, password)
      setUser(profile)
    } catch (err) {
      throw new Error(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    if (isFirebaseConfigured) {
      try {
        await signOutUser()
      } catch (err) {
        console.warn('Firebase sign-out notice:', err)
      }
    }
    setUser(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured')
    try {
      await resetPasswordService(email)
    } catch (err) {
      throw new Error(getAuthErrorMessage(err))
    }
  }, [])

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev))
      if (isFirebaseConfigured && user) {
        try {
          await updateUserProfile(user.uid, updates)
        } catch (err) {
          console.warn('Firestore profile update notice:', err)
        }
      }
    },
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, resetPassword, updateUser, isLoading, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context || defaultAuthContext
}
