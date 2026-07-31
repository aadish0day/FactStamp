import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, CheckCircle2, Forward, ShieldCheck, Users, Zap } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { VerdictPill } from '@/components/ui/VerdictPill'

const BENEFITS = [
  'Community-verified verdicts & consensus',
  'Downloadable 1080p WhatsApp PNG cards',
  'Real-time automated verification queue',
  'Built specifically for Indian WhatsApp forwards',
]

const STATS = [
  { value: '12,840+', label: 'Claims Debunked' },
  { value: '99.4%', label: 'Consensus Accuracy' },
  { value: '< 3 min', label: 'Avg Verify Time' },
]

interface AuthLayoutProps {
  heading: string
  subheading: string
  mode: 'signin' | 'signup'
  children: ReactNode
}

export function AuthLayout({ heading, subheading, mode, children }: AuthLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.08fr_1fr] min-h-dvh">
        {/* ── Brand Aside (Left Panel) ── */}
        <aside className="relative bg-[var(--color-surface-2)] overflow-hidden flex flex-col justify-between px-6 py-8 lg:px-14 lg:py-12 border-r border-[var(--color-border)] select-none">
          {/* Ambient glow orbs */}
          <div
            className="absolute w-[580px] h-[580px] rounded-full pointer-events-none -top-[200px] -right-[180px]"
            style={{
              background: 'radial-gradient(circle, var(--color-brand-subtle) 0%, transparent 70%)',
              animation: 'authFloat 14s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <div
            className="absolute w-[420px] h-[420px] rounded-full pointer-events-none -bottom-[180px] -left-[140px]"
            style={{
              background: 'radial-gradient(circle, oklch(0.44 0.10 195 / 0.08) 0%, transparent 70%)',
              animation: 'authFloat 18s ease-in-out infinite reverse',
            }}
            aria-hidden="true"
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              WebkitMaskImage: 'radial-gradient(circle at 30% 30%, #000 40%, transparent 85%)',
              maskImage: 'radial-gradient(circle at 30% 30%, #000 40%, transparent 85%)',
            }}
            aria-hidden="true"
          />

          {/* Header Back Button & Brand */}
          <div className="relative z-10 flex items-center justify-between mb-8 lg:mb-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--color-fg-2)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] hover:text-[var(--color-fg)] hover:border-[var(--color-border)] transition-all shadow-[var(--shadow-xs)]"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Home</span>
            </Link>

            <div className="inline-flex items-center gap-2 text-base font-extrabold tracking-tight text-[var(--color-fg)]">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-brand)] flex items-center justify-center text-white shadow-sm">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              </div>
              <span>FactStamp</span>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="relative z-10 my-auto py-4 w-full max-w-[460px] mx-auto flex flex-col">
            {/* Interactive WhatsApp Demo Card */}
            <div className="relative mb-8 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden group hover:border-[var(--color-brand-subtle)] transition-colors">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-[var(--color-brand-subtle)] opacity-50 blur-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar initials="M" size="sm" />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-[var(--color-fg)]">Family Group</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-fg-muted)]">
                      <Forward className="w-2.5 h-2.5" aria-hidden="true" />
                      Forwarded many times
                    </span>
                  </div>
                </div>
                <VerdictPill verdict="FALSE" size="sm" />
              </div>

              <p className="text-xs lg:text-sm text-[var(--color-fg)] leading-relaxed bg-[var(--color-surface-2)] rounded-xl p-3.5 italic border border-[var(--color-border-soft)]">
                &ldquo;Govt is closing all ATMs from midnight tonight! Withdraw all your cash now! 🚨&rdquo;
              </p>

              <div className="mt-3.5 pt-3 border-t border-[var(--color-border-soft)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[var(--color-v-false)] font-semibold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>FactStamp Verified: Fake News</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[var(--color-fg-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full border border-[var(--color-border-soft)]">
                  98% Confidence
                </span>
              </div>
            </div>

            {/* Headline & Subhead */}
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--color-fg)] leading-tight tracking-tight mb-3">
              Stop misinformation before it spreads to your family.
            </h1>
            <p className="text-sm text-[var(--color-fg-2)] leading-relaxed mb-6">
              Join thousands of community fact-checkers verifying viral forwards every day with source-backed evidence.
            </p>

            {/* Live Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border-soft)] shadow-[var(--shadow-xs)]">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col text-center">
                  <span className="text-base lg:text-lg font-extrabold font-mono text-[var(--color-brand)] tracking-tight">
                    {s.value}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bullet Benefits */}
            <ul className="flex flex-col gap-2.5">
              {BENEFITS.map((b, i) => (
                <li
                  key={b}
                  className="auth-benefits-item inline-flex items-center gap-2.5 text-xs lg:text-sm font-medium text-[var(--color-fg-2)] opacity-0"
                  style={{
                    animation: `fadeUp 400ms ease-out ${200 + i * 80}ms forwards`,
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-[var(--color-brand-subtle)] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-brand)]" aria-hidden="true" />
                  </div>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Copyright */}
          <div className="relative z-10 pt-6 border-t border-[var(--color-border-soft)] flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>&copy; {new Date().getFullYear()} FactStamp</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-fg-2)]">
              <Zap className="w-3 h-3 text-[var(--color-brand)]" />
              Verify before you forward
            </span>
          </div>
        </aside>

        {/* ── Form Side (Right Panel) ── */}
        <main className="relative flex items-center justify-center p-5 lg:p-12 bg-[var(--color-bg)]">
          {/* Subtle background glow */}
          <div className="absolute w-72 h-72 rounded-full bg-[var(--color-brand-subtle)] opacity-40 blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-[440px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-7 lg:p-9 animate-fade-in">
            {/* Top Auth Mode Segmented Switcher */}
            <div className="flex items-center p-1 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] mb-6">
              <Link
                to="/signin"
                state={location.state}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-[calc(var(--radius-md)-2px)] transition-all ${
                  mode === 'signin'
                    ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                state={location.state}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-[calc(var(--radius-md)-2px)] transition-all ${
                  mode === 'signup'
                    ? 'bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] border border-[var(--color-border-soft)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                }`}
              >
                Create Account
              </Link>
            </div>

            {/* Header */}
            <header className="mb-6">
              <h2 className="text-2xl font-extrabold text-[var(--color-fg)] tracking-tight">
                {heading}
              </h2>
              {subheading && (
                <p className="text-xs lg:text-sm text-[var(--color-fg-2)] mt-1.5 leading-relaxed">
                  {subheading}
                </p>
              )}
            </header>

            {children}

            {/* Footer Trust Indicator */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border-soft)] text-center">
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-v-true)]" aria-hidden="true" />
                256-bit encrypted authentication
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

