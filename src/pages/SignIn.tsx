import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/components/AuthLayout'
import { useAuth } from '@/contexts/AuthContext'
import { MOCK_USERS } from '@/lib/types'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => document.getElementById('signin-email')?.focus())
  }, [])

  const fieldError = (name: string) => {
    if (name === 'email') {
      if (!email.trim()) return 'Email address is required'
      if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTouched({ email: true, password: true })

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
      await login(email.trim())
      toast.success('Welcome back!', {
        description: 'Signed in successfully.',
      })
      // Redirect to the page the user originally tried to visit
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      navigate(from || '/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please check your credentials and try again.'
      toast.error('Sign in failed', {
        description: message,
      })
      setErrors((prev) => ({ ...prev, form: message }))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    toast.info('Google sign-in', {
      description: 'Use the demo accounts below instead.',
      duration: 3000,
    })
  }

  const summaryItems = Object.entries(errors)
    .filter(([, msg]) => msg)
    .map(([key, msg]) => ({
      key,
      msg,
      field: key === 'email' ? { label: 'Email Address', id: 'signin-email' } : { label: 'Password', id: 'signin-password' },
    }))

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to submit claims and help verify misinformation."
    >
      <Seo title="Sign In" description="Sign in to FactStamp to submit claims and help verify WhatsApp misinformation." />
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {/* Error summary */}
        {submitted && summaryItems.length > 0 && (
          <div
            className="p-3 rounded-[var(--radius-md)] border mb-1 animate-pop-in"
            style={{
              backgroundColor: 'var(--color-v-false-bg)',
              borderColor: 'color-mix(in srgb, var(--color-v-false) 35%, transparent)',
            }}
            role="alert"
          >
            <strong className="block text-xs font-semibold text-[var(--color-v-false)] mb-1.5">
              Please fix the following:
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

        <div>
          <label htmlFor="signin-email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Email Address
          </label>
          <Input
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4 text-[var(--color-fg-muted)]" />}
            value={email}
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
            <p className="mt-1 text-[11px] text-[var(--color-v-true)] font-medium">Valid email address</p>
          )}
          {errors.email && (
            <p id="signin-email-error" className="mt-1 text-[11px] text-[var(--color-v-false)]">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="signin-password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Password
          </label>
          <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4 text-[var(--color-fg-muted)]" />}
            value={password}
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
          {touched.password && !errors.password && password && (
            <p className="mt-1 text-[11px] text-[var(--color-v-true)]">Looks good</p>
          )}
          {errors.password && (
            <p id="signin-password-error" className="mt-1 text-[11px] text-[var(--color-v-false)]">{errors.password}</p>
          )}
        </div>

        {/* Form-level error */}
        {errors.form && (
          <p className="text-xs font-medium text-[var(--color-v-false)] animate-pop-in">
            {errors.form}
          </p>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="bg-transparent border-none text-xs font-medium text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] cursor-pointer transition-colors"
            onClick={() => {
              toast('Reset password', {
                description: 'Password reset is not available in demo mode. Use a demo account to sign in.',
              })
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          intent="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-fg-muted)]">OR</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      {/* Google sign-in */}
      <Button
        intent="secondary"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-[var(--color-fg-2)] mt-5">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-[var(--color-brand)] hover:underline">
          Create one
        </Link>
      </p>

      {/* Demo accounts */}
      <details className="mt-4 group">
        <summary className="text-xs font-medium text-[var(--color-fg-muted)] cursor-pointer hover:text-[var(--color-fg-2)] transition-colors list-none flex items-center gap-1">
          <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" aria-hidden="true" />
          Quick demo login
        </summary>
        <div className="mt-3 flex flex-col gap-1">
          {MOCK_USERS.map((u) => (
            <button
              key={u.uid}
              type="button"
              disabled={loading}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-left text-sm transition-colors',
                'hover:bg-[var(--color-brand-subtle)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]'
              )}
              onClick={async () => {
                setLoading(true)
                try {
                  await login(u.email)
                  toast.success('Signed in', {
                    description: `Welcome back, ${u.displayName}.`,
                  })
                  const from = (location.state as { from?: { pathname: string } })?.from?.pathname
                  navigate(from || '/')
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Sign in failed'
                  toast.error('Sign in failed', {
                    description: message,
                  })
                } finally {
                  setLoading(false)
                }
              }}
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {u.displayName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--color-fg)] truncate">{u.displayName}</p>
                <p className="text-[10px] text-[var(--color-fg-muted)]">{u.email}</p>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-[var(--color-brand)]">{u.reputation}%</span>
            </button>
          ))}
        </div>
      </details>
    </AuthLayout>
  )
}
