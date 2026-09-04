import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  Clock,
  ShieldCheck,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/components/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  formatLockoutRemaining,
  MAX_LOGIN_ATTEMPTS,
  sanitizeTextInput,
  type LoginRateLimitResult,
} from '@/lib/security'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEMO_ACCOUNTS = [
  { name: 'FactStamp Admin', email: 'admin@factstamp.app', role: 'Super Admin', rep: '100%' },
  { name: 'Priya Sharma', email: 'priya@factstamp.app', role: 'Platform Admin', rep: '95%' },
  { name: 'Raj Patel', email: 'raj@factstamp.app', role: 'Senior Verifier', rep: '94%' },
  { name: 'Vikram Singh', email: 'vikram@factstamp.app', role: 'Fact-Checker', rep: '91%' },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, resetPassword, isFirebaseConfigured } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false)

  // Security: Rate limiting & Brute force protection
  const [rateLimit, setRateLimit] = useState<LoginRateLimitResult>(() => checkLoginRateLimit())
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0)

  // Sync rate limit state when email changes & handle active countdown interval
  const syncRateLimit = useCallback((targetEmail?: string) => {
    const current = checkLoginRateLimit(targetEmail || email.trim())
    setRateLimit(current)
    setLockoutRemaining(current.lockoutRemainingMs)
    return current
  }, [email])

  useEffect(() => {
    requestAnimationFrame(() => document.getElementById('signin-email')?.focus())
  }, [])

  // Live countdown timer while lockout is active
  useEffect(() => {
    const current = syncRateLimit(email.trim())

    if (current.isLockedOut && current.lockoutRemainingMs > 0) {
      const interval = setInterval(() => {
        const updated = checkLoginRateLimit(email.trim())
        setRateLimit(updated)
        setLockoutRemaining(updated.lockoutRemainingMs)

        if (!updated.isLockedOut) {
          clearInterval(interval)
          setErrors((prev) => ({ ...prev, form: '' }))
          toast.success('Security Lockout Expired', {
            description: 'You can now attempt to sign in again.',
          })
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [email, syncRateLimit])

  const fieldError = (name: string) => {
    if (name === 'email') {
      const trimmed = email.trim()
      if (!trimmed) return 'Email address is required'
      if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address'
    }
    if (name === 'password') {
      if (!password) return 'Password is required'
    }
    return ''
  }

  const revalidate = (name: string) => {
    setErrors((prev) => ({ ...prev, [name]: fieldError(name) }))
  }

  const onBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    revalidate(name)
  }

  const handleFillDemoAccount = (accEmail: string) => {
    setEmail(accEmail)
    setPassword('FactStamp@2026')
    setTouched({ email: true, password: true })
    setErrors({})
    syncRateLimit(accEmail)
    toast.info(`Loaded ${accEmail}`, {
      description: 'Credentials filled. Click "Sign In" to proceed.',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTouched({ email: true, password: true })

    const cleanEmail = sanitizeTextInput(email.trim().toLowerCase())

    // 01. Proactive Rate Limit Enforcement
    const currentStatus = checkLoginRateLimit(cleanEmail)
    if (currentStatus.isLockedOut) {
      setRateLimit(currentStatus)
      setLockoutRemaining(currentStatus.lockoutRemainingMs)
      toast.error('Account Temporarily Locked', {
        description: `Too many failed attempts. Unlock in ${formatLockoutRemaining(currentStatus.lockoutRemainingMs)}.`,
      })
      return
    }

    const newErrors: Record<string, string> = {}
    const emailErr = fieldError('email')
    const passErr = fieldError('password')
    if (emailErr) newErrors.email = emailErr
    if (passErr) newErrors.password = passErr
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstId = newErrors.email ? 'signin-email' : 'signin-password'
      document.getElementById(firstId)?.focus()
      return
    }

    setLoading(true)
    try {
      const profile = await login(cleanEmail, password)

      // 02. Successful authentication: reset failed attempt counters
      resetLoginAttempts(cleanEmail)
      setRateLimit(checkLoginRateLimit(cleanEmail))

      toast.success('Welcome back!', {
        description: `Signed in as ${profile?.displayName || 'Verifier'}.`,
      })

      // Staff accounts navigate to admin command center; general users go to destination
      if (profile?.isAdmin) {
        navigate('/admin')
        return
      }
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      navigate(from || '/')
    } catch (err) {
      // 03. Failed authentication: increment failed attempts counter
      const updatedLimit = recordFailedLogin(cleanEmail)
      setRateLimit(updatedLimit)
      setLockoutRemaining(updatedLimit.lockoutRemainingMs)

      if (updatedLimit.isLockedOut) {
        const errorMsg = `Account locked due to 5 consecutive failed attempts. Please wait ${formatLockoutRemaining(updatedLimit.lockoutRemainingMs)} before retrying.`
        setErrors((prev) => ({ ...prev, form: errorMsg }))
        toast.error('Security Lockout Triggered', {
          description: errorMsg,
        })
      } else {
        const remainingNote = `${updatedLimit.remainingAttempts} attempt${updatedLimit.remainingAttempts === 1 ? '' : 's'} remaining before temporary 15-minute lockout.`
        const generalMsg = err instanceof Error ? err.message : 'Invalid email or password.'
        const fullMsg = `${generalMsg} (${remainingNote})`
        setErrors((prev) => ({ ...prev, form: fullMsg }))
        toast.error('Sign In Failed', {
          description: remainingNote,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      setLoading(true)
      await loginWithGoogle()
      resetLoginAttempts('global')
      toast.success('Signed in with Google', {
        description: 'Successfully authenticated via Google OAuth.',
      })
      navigate('/dashboard')
    } catch (err: any) {
      toast.error('Google sign-in failed', {
        description: err.message || 'Failed to authenticate.',
      })
    } finally {
      setLoading(false)
    }
  }

  const summaryItems = Object.entries(errors)
    .filter(([key, msg]) => key !== 'form' && msg)
    .map(([key, msg]) => ({
      key,
      msg,
      field: key === 'email' ? { label: 'Email Address', id: 'signin-email' } : { label: 'Password', id: 'signin-password' },
    }))

  return (
    <AuthLayout
      mode="signin"
      heading="Welcome back"
      subheading="Sign in to your verifier account to fact-check community claims and earn reputation."
    >
      <Seo title="Sign In — FactStamp" description="Sign in to FactStamp to participate in community fact-checks." />

      {/* ── Security Lockout Banner (active when 5 failed attempts reached) ── */}
      {rateLimit.isLockedOut && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 p-4 rounded-[var(--radius-lg)] border border-[var(--color-v-false-border)] bg-[var(--color-v-false-bg)] text-center space-y-2 animate-pop-in shadow-[var(--shadow-sm)]"
        >
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-v-false)]/15 text-[var(--color-v-false)] mb-0.5">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-v-false)]">
            Security Rate Limit Active
          </h3>
          <p className="text-xs text-[var(--color-fg-2)] leading-relaxed">
            Too many failed login attempts recorded. Sign-in is temporarily suspended to protect accounts against credential guessing.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-xs font-bold text-[var(--color-fg)] shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[var(--color-v-false)] animate-pulse" aria-hidden="true" />
            <span>Unlocks in: {formatLockoutRemaining(lockoutRemaining)}</span>
          </div>
        </div>
      )}

      {/* ── Security Status Pill: Active Rate Limiting Guard ── */}
      {!rateLimit.isLockedOut && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-4 rounded-lg bg-[var(--color-surface-2)]/60 border border-[var(--color-border-soft)] text-[11px] text-[var(--color-fg-muted)]">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            Brute-force protection enabled
          </span>
          <span className="font-mono text-[10px] font-bold">
            {rateLimit.remainingAttempts}/{MAX_LOGIN_ATTEMPTS} attempts left
          </span>
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {/* Error summary */}
        {submitted && summaryItems.length > 0 && (
          <div
            className="p-3.5 rounded-[var(--radius-md)] border mb-1 animate-pop-in shadow-[var(--shadow-xs)]"
            style={{
              backgroundColor: 'var(--color-v-false-bg)',
              borderColor: 'color-mix(in srgb, var(--color-v-false) 35%, transparent)',
            }}
            role="alert"
          >
            <strong className="text-xs font-bold text-[var(--color-v-false)] mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Please check the following:
            </strong>
            <ul className="flex flex-col gap-1">
              {summaryItems.map((it) => (
                <li key={it.key}>
                  <button
                    type="button"
                    className="bg-transparent border-none p-0 text-left cursor-pointer text-xs text-[var(--color-fg)] hover:text-[var(--color-v-false)] hover:underline"
                    onClick={() => document.getElementById(it.field.id)?.focus()}
                  >
                    {it.field.label}: {it.msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Email input */}
        <div>
          <label htmlFor="signin-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Email Address
          </label>
          <Input
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="verifier@factstamp.app"
            leftIcon={<Mail className="w-4 h-4 text-[var(--color-fg-muted)]" />}
            value={email}
            disabled={rateLimit.isLockedOut}
            onChange={(e) => {
              setEmail(e.target.value)
              if (touched.email) {
                setErrors((prev) => ({ ...prev, email: fieldError('email'), form: '' }))
              }
            }}
            onBlur={() => onBlur('email')}
            error={!!errors.email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'signin-email-error' : undefined}
          />
          {touched.email && !errors.email && email && (
            <p className="mt-1 text-[11px] text-[var(--color-v-true)] font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 text-[var(--color-v-true)]" aria-hidden="true" />
              Valid email format
            </p>
          )}
          {errors.email && (
            <p id="signin-email-error" className="mt-1 text-[11px] text-[var(--color-v-false)] font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="signin-password" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)]">
              Password
            </label>
            <button
              type="button"
              className="bg-transparent border-none text-xs font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] cursor-pointer transition-colors"
              onClick={async () => {
                if (!email.trim()) {
                  toast.error('Enter your email first', {
                    description: 'Please enter your email to receive password reset instructions.',
                  })
                  document.getElementById('signin-email')?.focus()
                  return
                }
                try {
                  await resetPassword(email.trim())
                  toast.success('Reset Instructions Sent', {
                    description: `Password reset email dispatched to ${email.trim()}.`,
                  })
                } catch (err) {
                  toast.error('Reset Failed', {
                    description: err instanceof Error ? err.message : 'Please try again later.',
                  })
                }
              }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-[var(--color-fg-muted)]" />}
              value={password}
              disabled={rateLimit.isLockedOut}
              onChange={(e) => {
                setPassword(e.target.value)
                if (touched.password) {
                  setErrors((prev) => ({ ...prev, password: fieldError('password'), form: '' }))
                }
              }}
              onBlur={() => onBlur('password')}
              error={!!errors.password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'signin-password-error' : undefined}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 bg-transparent border-none cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.password && (
            <p id="signin-password-error" className="mt-1 text-[11px] text-[var(--color-v-false)] font-medium">{errors.password}</p>
          )}
        </div>

        {/* Form-level error / Rate limit feedback */}
        {errors.form && (
          <div
            className="p-3 rounded-[var(--radius-md)] bg-[var(--color-v-false-bg)] border border-[var(--color-v-false-border)] text-xs font-semibold text-[var(--color-v-false)] flex items-start gap-2 animate-pop-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          intent="primary"
          size="lg"
          className="w-full mt-1 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer font-bold"
          loading={loading}
          disabled={rateLimit.isLockedOut || loading}
        >
          {rateLimit.isLockedOut
            ? `Locked Out (${formatLockoutRemaining(lockoutRemaining)})`
            : 'Sign In Securely'}
        </Button>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-fg-muted)]">OR</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Google sign-in */}
      <Button
        intent="secondary"
        size="lg"
        className="w-full font-semibold border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
        onClick={handleGoogle}
        disabled={rateLimit.isLockedOut || loading}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      {/* ── Demo Verifier Accounts Quick-Fill Helper ── */}
      <div className="mt-6 pt-5 border-t border-[var(--color-border-soft)]">
        <button
          type="button"
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--color-fg-2)] hover:text-[var(--color-fg)] transition-colors bg-transparent border-none cursor-pointer py-1"
        >
          <span className="flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-[var(--color-brand)]" aria-hidden="true" />
            Demo Accounts for Testing
          </span>
          {showDemoAccounts ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-fg-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-fg-muted)]" />
          )}
        </button>

        {showDemoAccounts && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <p className="text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
              Click any verified tester account to auto-fill credentials:
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleFillDemoAccount(acc.email)}
                  className="w-full text-left p-2 rounded-lg bg-[var(--color-surface-2)]/70 hover:bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] transition-colors cursor-pointer flex items-center justify-between text-xs group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--color-fg)] truncate group-hover:text-[var(--color-brand)]">
                      {acc.name}
                    </p>
                    <p className="text-[10px] text-[var(--color-fg-muted)] font-mono truncate">
                      {acc.email}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ms-2">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand-subtle)]">
                      {acc.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--color-fg-muted)] text-center mt-2 font-mono">
              Password for all seeded accounts: FactStamp@2026
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
