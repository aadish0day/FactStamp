import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@/lib/types'
import {
  auth,
  onAuthStateChanged,
  isFirebaseConfigured,
  db,
  COLLECTIONS,
  doc,
  onSnapshot,
} from '@/lib/firebase'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogleProvider,
  signOutUser,
  resetPassword as resetPasswordService,
  updateUserProfile,
  getAuthErrorMessage,
  ensureProfile,
  resendVerificationEmail,
  refreshEmailVerification,
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
  /** Firebase Auth's emailVerified (Google sign-ins are always true). */
  emailVerified: boolean
  /** Signed in, not an admin, and the email is unverified: may browse but not submit or vote. */
  needsEmailVerification: boolean
  resendVerification: () => Promise<void>
  /** Reloads the user and forces a token refresh; resolves to the new status. */
  refreshVerification: () => Promise<boolean>
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
  emailVerified: false,
  needsEmailVerification: false,
  resendVerification: async () => {},
  refreshVerification: async () => false,
}

const AuthContext = createContext<AuthContextValue>(defaultAuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured)
  const [emailVerified, setEmailVerified] = useState(false)

  // Realtime profile subscription to Firestore user document
  useEffect(() => {
    if (!isFirebaseConfigured) return

    let unsubscribeProfile: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Drop the previous account's listener on every auth change, not just on
      // sign-out. An A→B switch (the /admin gate does this) otherwise left A's
      // listener live — B, as an admin, can still read A's profile — and any
      // change to it called setUser(A), bouncing the admin out of /admin.
      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = null
      }
      setEmailVerified(firebaseUser?.emailVerified ?? false)
      // Verified in another tab/session: the profile says so, but a cached ID
      // token can still carry email_verified=false for up to an hour, and
      // that token is what Firestore rules check.
      if (firebaseUser?.emailVerified) {
        firebaseUser.getIdTokenResult()
          .then((t) => (t.claims.email_verified ? undefined : firebaseUser.getIdToken(true)))
          .catch(() => {})
      }

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
              const data = snap.data() as User
              const rawName = typeof data.displayName === 'string' ? data.displayName.trim() : ''
              const authName = typeof firebaseUser.displayName === 'string' ? firebaseUser.displayName.trim() : ''
              const emailPrefix = firebaseUser.email ? firebaseUser.email.split('@')[0] : ''
              const displayName = rawName || authName || emailPrefix || 'Verifier'
              setUser({ ...data, displayName })
            } else {
              // No profile yet: create it and let the next snapshot deliver it.
              // Previously this showed a local profile the database might never
              // accept (a deleted account's write is refused) — ensureProfile
              // signs such an account out instead.
              ensureProfile(firebaseUser).catch((err) => {
                console.warn('Could not create user profile:', err)
                setIsLoading(false)
              })
              return
            }
            setIsLoading(false)
          },
          (err) => {
            console.warn('Realtime profile subscription failed:', err)
            setIsLoading(false)
          }
        )
      } else {
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
    if (!isFirebaseConfigured) {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev))
      return
    }
    // Read the uid from Firebase Auth rather than React state: during an account
    // switch the state still holds the previous profile, which is exactly how the
    // /admin gate ended up writing isAdmin onto the wrong user.
    const uid = auth.currentUser?.uid
    if (!uid) return
    // Write first and let the onSnapshot subscription deliver the committed
    // values. The previous version merged optimistically and only console.warn'd
    // on rejection, so a write Firestore refused still left the UI showing values
    // the database never accepted — and the caller was told nothing. Rejections
    // now propagate; callers are responsible for surfacing them.
    await updateUserProfile(uid, updates)
  }, [])

  const resendVerification = useCallback(async () => {
    try {
      await resendVerificationEmail()
    } catch (err) {
      throw new Error(getAuthErrorMessage(err))
    }
  }, [])

  const refreshVerification = useCallback(async () => {
    try {
      const verified = await refreshEmailVerification()
      setEmailVerified(verified)
      return verified
    } catch (err) {
      throw new Error(getAuthErrorMessage(err))
    }
  }, [])

  const needsEmailVerification = !!user && !emailVerified && !user.isAdmin

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, signup, logout, resetPassword, updateUser, isLoading, isFirebaseConfigured, emailVerified, needsEmailVerification, resendVerification, refreshVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context || defaultAuthContext
}
