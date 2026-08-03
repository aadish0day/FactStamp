import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Footer() {
  const { user } = useAuth()

  return (
    <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface)] mt-16">
      <div className="container mx-auto px-[clamp(1rem,4vw,3rem)]">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_2fr] gap-8 py-12">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-bold text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md"
            >
              <ShieldAlert className="w-5 h-5 text-[var(--color-brand)]" aria-hidden="true" />
              <span>FactStamp</span>
            </Link>
            <p className="mt-3 text-sm text-[var(--color-fg-2)] max-w-xs leading-relaxed">
              Verify before you forward. A community-powered fact-checker fighting WhatsApp misinformation in India.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)] mb-1">
                Product
              </span>
              <Link to="/submit" className="text-sm text-[var(--color-fg-2)] hover:text-[var(--color-brand)] transition-colors">
                Check a Forward
              </Link>
              <Link to="/verify" className="text-sm text-[var(--color-fg-2)] hover:text-[var(--color-brand)] transition-colors">
                Verify Queue
              </Link>
              <Link to="/dashboard" className="text-sm text-[var(--color-fg-2)] hover:text-[var(--color-brand)] transition-colors">
                Dashboard
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)] mb-1">
                Account
              </span>
              {user ? (
                <>
                  <span className="text-sm text-[var(--color-fg-2)]">
                    Signed in as <span className="text-[var(--color-fg)] font-medium">{user.displayName}</span>
                  </span>
                </>
              ) : (
                <>
                  <Link to="/signin" className="text-sm text-[var(--color-fg-2)] hover:text-[var(--color-brand)] transition-colors">
                    Sign in
                  </Link>
                  <Link to="/signup" className="text-sm text-[var(--color-fg-2)] hover:text-[var(--color-brand)] transition-colors">
                    Create account
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)] mb-1">
                About
              </span>
              <span className="text-sm text-[var(--color-fg-muted)]">
                Beta · Made in India
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 border-t border-[var(--color-border)] text-sm text-[var(--color-fg-muted)]">
          <span>© {new Date().getFullYear()} FactStamp — A community misinformation fact-checker</span>
          <span className="font-mono text-xs">factstamp.app</span>
        </div>
      </div>
    </footer>
  )
}
