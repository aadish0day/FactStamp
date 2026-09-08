import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, Lock, ArrowLeft, AlertCircle, User as UserIcon, Key, KeyRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { authenticateAdmin } from '@/services/firebaseService'
import { toast } from 'sonner'
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  formatLockoutRemaining,
} from '@/lib/security'

interface AdminRouteProps {
  children: ReactNode
}

const ADMIN_SESSION_KEY = 'fs_admin_session_unlocked'

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  })

  const fillDemoAdmin = (email: string) => {
    setUsernameInput(email)
    setPasswordInput('FactStamp@2026')
    setError(null)
  }

  // Loading state from auth
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)] animate-spin" />
          <span className="text-sm text-[var(--color-fg-muted)]">Connecting to Firebase DB & verifying clearance…</span>
        </div>
      </div>
    )
  }

  // SECURITY FIX: Even if sessionStorage says unlocked, the user object MUST
  // have isAdmin === true from the Firestore profile snapshot. This prevents
  // bypass via DevTools `sessionStorage.setItem('fs_admin_session_unlocked', 'true')`.
  const hasVerifiedAdminRole = user?.isAdmin === true

  if (isSessionUnlocked && user && hasVerifiedAdminRole) {
    return <>{children}</>
  }

  // If sessionStorage claims unlocked but user isn't actually admin, force re-auth
  if (isSessionUnlocked && user && !hasVerifiedAdminRole) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
  }

  // Handle Username & Password Submission connected to Firebase DB
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // 08. Authentication: Brute-force rate limiting
    const rateLimit = checkLoginRateLimit()
    if (!rateLimit.allowed) {
      setError(`Too many failed attempts. Console locked for security. Try again in ${formatLockoutRemaining(rateLimit.lockoutRemainingMs)}.`)
      setIsSubmitting(false)
      return
    }

    const u = usernameInput.trim()
    const p = passwordInput

    if (!u || !p) {
      setError('Please provide both username and password.')
      setIsSubmitting(false)
      return
    }

    try {
      // Authenticates with Firebase Auth and syncs with Firestore Database
      const adminProfile = await authenticateAdmin(u, p)
      resetLoginAttempts()
      // Promote the admin role into the app-level auth state immediately.
      // The Firestore profile snapshot that drives useAuth() can arrive stale
      // (before authenticateAdmin's updateDoc commits), which would otherwise
      // bounce the admin back to this gate as a "normal user".
      await updateUser({ isAdmin: true })
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
      setIsSessionUnlocked(true)
      toast.success('Admin authenticated with Firebase DB', {
        description: `Connected as ${adminProfile.displayName} (${adminProfile.email}).`,
      })
    } catch (err: unknown) {
      recordFailedLogin()
      console.error('Firebase admin login error:', err)
      const remaining = checkLoginRateLimit()
      const msg = err instanceof Error ? err.message : 'Invalid administrator credentials'
      setError(remaining.remainingAttempts > 0
        ? `${msg} (${remaining.remainingAttempts} attempt${remaining.remainingAttempts !== 1 ? 's' : ''} remaining)`
        : msg
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-xl)] relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-accent)] to-[var(--color-brand)]" />

        {/* Theme Toggle Button */}
        <div className="absolute top-3.5 right-3.5 z-10">
          <ThemeToggle />
        </div>

        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-subtle)] border border-[var(--color-border)] flex items-center justify-center mb-3 text-[var(--color-brand)] shadow-xs">
            <Lock className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[var(--color-surface-2)] text-[var(--color-fg-2)] border border-[var(--color-border-soft)] mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            FIREBASE DB GATE: /admin
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-fg)]">
            Admin Authentication
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-fg-muted)] mt-1 max-w-xs">
            Sign in with administrator credentials to access the FactStamp Command Center.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] text-xs text-[var(--color-v-false)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[var(--color-brand)]" />
              Username or Admin Email
            </label>
            <Input
              type="text"
              placeholder="e.g. admin or admin@factstamp.app"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              autoFocus
              className="w-full text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-fg-2)] mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[var(--color-brand)]" />
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              className="w-full text-sm font-medium"
            />
          </div>

          <Button
            type="submit"
            intent="primary"
            className="w-full py-2.5 font-semibold text-sm cursor-pointer shadow-xs"
            disabled={isSubmitting}
          >
            <Lock className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Connecting to Firebase DB…' : 'Sign in to /admin'}
          </Button>
        </form>

        {/* Demo Admin Quick-Fill Helper */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border-soft)]">
          <p className="text-[11px] font-semibold text-[var(--color-fg-muted)] mb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            Authorized Demo Admins (Password: <code className="text-[10px] bg-[var(--color-surface-2)] px-1 py-0.5 rounded font-mono text-[var(--color-fg)]">FactStamp@2026</code>)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAdmin('priya@factstamp.app')}
              className="p-2 text-left rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] transition-colors text-xs cursor-pointer group"
            >
              <span className="font-semibold text-[var(--color-fg)] block text-[11px] group-hover:text-[var(--color-brand)]">Priya Sharma</span>
              <span className="text-[10px] text-[var(--color-fg-muted)] block truncate">priya@factstamp.app</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAdmin('admin@factstamp.app')}
              className="p-2 text-left rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] transition-colors text-xs cursor-pointer group"
            >
              <span className="font-semibold text-[var(--color-fg)] block text-[11px] group-hover:text-[var(--color-brand)]">FactStamp Admin</span>
              <span className="text-[10px] text-[var(--color-fg-muted)] block truncate">admin@factstamp.app</span>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border-soft)] flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:text-[var(--color-fg)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Site
          </Link>
          <span className="font-mono text-[10px]">FactStamp v1.0</span>
        </div>
      </div>
    </div>
  )
}
