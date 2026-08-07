import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, Mail, User, Shield, ShieldCheck, Eye, EyeOff, Zap } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/components/AuthLayout'
import { PasswordStrength } from '@/components/ui/PasswordStrength'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PW_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/

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

const PW_REQS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: '12+ characters (strong)', test: (p: string) => p.length >= 12 },
]

const STR_META = [
  { label: '', color: 'var(--color-border)' },
  { label: 'Weak', color: 'var(--color-v-false)' },
  { label: 'Flimsy', color: 'var(--color-v-mislead)' },
  { label: 'Solid', color: 'var(--color-v-mislead)' },
  { label: 'Bulletproof', color: 'var(--color-v-true)' },
]

export function SignUp() {
  const navigate = useNavigate()
  const { signup, loginWithGoogle } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => document.getElementById('reg-name')?.focus())
  }, [])

  const fieldError = (name: string) => {
    if (name === 'name') {
      if (form.name.trim().length < 2) return 'Name must be at least 2 characters'
    }
    if (name === 'email') {
      if (!form.email.trim()) return 'Email address is required'
      if (!EMAIL_RE.test(form.email)) return 'Please enter a valid email address'
    }
    if (name === 'password') {
      if (!PW_RE.test(form.password)) return 'Must be 8+ characters with 1 uppercase and 1 number'
    }
    if (name === 'confirm') {
      if (form.confirm !== form.password) return 'Passwords do not match'
    }
    if (name === 'agree') {
      if (!agree) return 'Please agree to verify honestly'
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
    setTouched({ name: true, email: true, password: true, confirm: true, agree: true })

    const newErrors: Record<string, string> = {}
    ;['name', 'email', 'password', 'confirm', 'agree'].forEach((k) => {
      const msg = fieldError(k)
      if (msg) newErrors[k] = msg
    })
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstKey = ['name', 'email', 'password', 'confirm', 'agree'].find((k) => newErrors[k])
      const fieldIds: Record<string, string> = {
        name: 'reg-name',
        email: 'reg-email',
        password: 'reg-pass',
        confirm: 'reg-confirm',
      }
      if (firstKey && fieldIds[firstKey]) {
        document.getElementById(fieldIds[firstKey])?.focus()
      }
      return
    }

    setLoading(true)
    try {
      await signup(form.name.trim(), form.email.trim(), form.password)
      toast.success('Account created', {
        description: `Welcome to FactStamp, ${form.name.trim()}!`,
        icon: <Shield className="w-5 h-5 text-[var(--color-v-true)]" />,
      })
      navigate('/')
    } catch (err) {
      toast.error('Sign up failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const metCount = PW_REQS.filter((r) => r.test(form.password)).length
  const pwPct = (metCount / PW_REQS.length) * 100
  const pwColor = STR_META[metCount].color

  const summaryItems = Object.entries(errors)
    .filter(([, msg]) => msg)
    .map(([key, msg]) => ({
      key,
      msg,
      field: (() => {
        const labels: Record<string, { label: string; id: string }> = {
          name: { label: 'Full Name', id: 'reg-name' },
          email: { label: 'Email Address', id: 'reg-email' },
          password: { label: 'Password', id: 'reg-pass' },
          confirm: { label: 'Confirm Password', id: 'reg-confirm' },
        }
        return labels[key] || { label: key, id: '' }
      })(),
    }))

  return (
    <AuthLayout
      mode="signup"
      heading="Create your account"
      subheading="Join our community of verifiers and stop WhatsApp misinformation."
    >
      <Seo title="Create Account" description="Join FactStamp's community fact-checkers to help stop WhatsApp misinformation in India." />

      {/* Starting Reputation Bonus Callout */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-[var(--color-brand)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] mb-1.5 self-start">
        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Start with 50 Verifier Reputation Points</span>
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
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
            <strong className="block text-xs font-bold text-[var(--color-v-false)] mb-1.5">
              Please fix the following:
            </strong>
            <ul className="flex flex-col gap-1">
              {summaryItems.map((it) => (
                <li key={it.key}>
                  <button
                    type="button"
                    className="bg-transparent border-none p-0 text-left cursor-pointer text-xs text-[var(--color-fg)] hover:text-[var(--color-v-false)] hover:underline"
                    onClick={() => it.field.id && document.getElementById(it.field.id)?.focus()}
                  >
                    {it.field.label}: {it.msg}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Full Name
          </label>
          <Input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Ananya Gupta"
            leftIcon={<User className="w-4 h-4 text-[var(--color-fg-muted)]" />}
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }))
              if (touched.name) revalidate('name')
            }}
            onBlur={() => onBlur('name')}
            error={!!errors.name}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'reg-name-error' : undefined}
          />
          {touched.name && !errors.name && form.name && (
            <p className="mt-1 text-[11px] text-[var(--color-v-true)] font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-[var(--color-v-true)]" aria-hidden="true" />
              Looks good
            </p>
          )}
          {errors.name && <p id="reg-name-error" className="mt-1 text-[11px] text-[var(--color-v-false)] font-medium">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Email Address
          </label>
          <Input
            id="reg-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4 text-[var(--color-fg-muted)]" />}
            value={form.email}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, email: e.target.value }))
              if (touched.email) revalidate('email')
            }}
            onBlur={() => onBlur('email')}
            error={!!errors.email}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
          />
          {touched.email && !errors.email && form.email && (
            <p className="mt-1 text-[11px] text-[var(--color-v-true)] font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-[var(--color-v-true)]" aria-hidden="true" />
              Valid email format
            </p>
          )}
          {errors.email && <p id="reg-email-error" className="mt-1 text-[11px] text-[var(--color-v-false)] font-medium">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-pass" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Password
          </label>
          <div className="relative">
            <Input
              id="reg-pass"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-[var(--color-fg-muted)]" />}
              value={form.password}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, password: e.target.value }))
                if (touched.password) revalidate('password')
              }}
              onBlur={() => onBlur('password')}
              error={!!errors.password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reg-pass-error' : undefined}
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
          {errors.password && <p id="reg-pass-error" className="mt-1 text-[11px] text-[var(--color-v-false)] font-medium">{errors.password}</p>}

          {/* Password Strength Indicator with spring cell transitions and crossfade labels */}
          <AnimatePresence>
            {form.password && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden mt-3"
              >
                <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] shadow-[var(--shadow-xs)]">
                  <PasswordStrength value={form.password} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reg-confirm" className="block text-xs font-bold uppercase tracking-wider text-[var(--color-fg-2)] mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="reg-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-[var(--color-fg-muted)]" />}
              value={form.confirm}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, confirm: e.target.value }))
                if (touched.confirm) revalidate('confirm')
              }}
              onBlur={() => onBlur('confirm')}
              error={!!errors.confirm}
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? 'reg-confirm-error' : undefined}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 bg-transparent border-none cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
          {touched.confirm && !errors.confirm && form.confirm && (
            <p className="mt-1 text-[11px] text-[var(--color-v-true)] font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-[var(--color-v-true)]" aria-hidden="true" />
              Passwords match
            </p>
          )}
          {errors.confirm && <p id="reg-confirm-error" className="mt-1 text-[11px] text-[var(--color-v-false)] font-medium">{errors.confirm}</p>}
        </div>

        {/* Agreement checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none mt-1 p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)]/60 transition-colors">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked)
              if (touched.agree) revalidate('agree')
            }}
            onBlur={() => onBlur('agree')}
            className="peer sr-only"
            aria-describedby={errors.agree ? 'reg-agree-error' : undefined}
          />
          <span
            className={cn(
              'flex-shrink-0 w-[18px] h-[18px] rounded-[var(--radius-sm)] border flex items-center justify-center text-white transition-all mt-0.5 shadow-xs',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent)] peer-focus-visible:ring-offset-2',
              agree
                ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
                : 'bg-[var(--color-surface)] border-[var(--color-border)]'
            )}
            aria-hidden="true"
          >
            {agree && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          <span className="text-xs text-[var(--color-fg-2)] leading-relaxed">
            I agree to verify claims honestly with credible sources and follow FactStamp guidelines.
          </span>
        </label>
        {errors.agree && <p id="reg-agree-error" className="text-[11px] text-[var(--color-v-false)] font-medium mt-0.5">{errors.agree}</p>}

        <Button
          type="submit"
          intent="primary"
          size="lg"
          className="w-full mt-2 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer font-bold"
          loading={loading}
        >
          Create Account
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
        onClick={async () => {
          try {
            setLoading(true)
            await loginWithGoogle()
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
        }}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
    </AuthLayout>
  )
}
