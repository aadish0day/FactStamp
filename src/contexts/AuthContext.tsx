import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import {
  auth,
  onAuthStateChanged,
  isFirebaseConfigured,
  db,
  COLLECTIONS,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from '@/lib/firebase'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogleProvider,
  signOutUser,
  resetPassword as resetPasswordService,
  updateUserProfile,
  getAuthErrorMessage,
} from '@/services/firebaseService'
import {
  recordActivity,
  isSessionExpired,
  clearSecuritySession,
} from '@/lib/security'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<User | null>
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
  login: async () => null,
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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)

  // Realtime profile subscription to Firestore user document
  useEffect(() => {
    if (!isFirebaseConfigured) return

    let unsubscribeProfile: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 09. Session Hijacking: Check for idle session timeout on re-auth
        if (isSessionExpired()) {
          clearSecuritySession()
          await signOutUser().catch(() => {})
          setUser(null)
          setIsLoading(false)
          return
        }
        recordActivity()

        const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid)
        
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              setUser(snap.data() as User)
            } else {
              const newProfile: User = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName || 'Verifier',
                email: firebaseUser.email || '',
                reputation: 50,
                totalVerifications: 0,
                joinedAt: new Date().toISOString(),
              }
              setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp() }).catch((err) => {
                console.warn('Failed to initialize user document in Firestore:', err)
              })
              setUser(newProfile)
            }
            setIsLoading(false)
          },
          (err) => {
            console.warn('Realtime profile subscription failed:', err)
            setIsLoading(false)
          }
        )
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile()
          unsubscribeProfile = null
        }
        setUser(null)
        setIsLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeProfile) {
        unsubscribeProfile()
      }
    }
  }, [])

  // 09. Session Hijacking: Track user activity and auto-expire idle sessions
  useEffect(() => {
    const handleActivity = () => recordActivity()
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }))

    // Check idle timeout every 60 seconds
    const idleCheck = setInterval(async () => {
      if (user && isSessionExpired()) {
        clearSecuritySession()
        await signOutUser().catch(() => {})
        setUser(null)
      }
    }, 60_000)

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleActivity))
      clearInterval(idleCheck)
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured')
    setIsLoading(true)
    try {
      const profile = await signInWithEmail(email, password)
      setUser(profile)
      return profile
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
    // 09. Session Hijacking: Clear all security session tokens on logout
    clearSecuritySession()
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

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      if (isFirebaseConfigured) {
        updateUserProfile(prev.uid, updates).catch((err) => {
          console.warn('Firestore profile update notice:', err)
        })
      }
      return next
    })
  }, [])

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
