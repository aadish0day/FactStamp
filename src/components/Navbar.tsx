import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Menu, X, ShieldAlert, Sun, Moon, User, Star, LogOut } from 'lucide-react'
import { useEffect, useCallback, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from '@/components/NotificationBell'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const drawerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const handleLogout = () => {
    logout()
    toast('Signed out', {
      description: 'You have been signed out successfully.',
    })
  }
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Verify Claims', path: '/verify', protected: true },
    { label: 'Dashboard', path: '/dashboard', protected: true },
    { label: 'My Profile', path: '/profile', protected: true },
  ]

  const isActive = (path: string) => location.pathname === path

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Close on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Escape key
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, closeMobile])

  // Body scroll lock
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Focus trap: keep focus inside drawer when open
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return
    const drawer = drawerRef.current
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }, [mobileOpen])

  return (
    <nav className="sticky top-0 z-50 h-[60px] bg-[var(--color-surface)] border-b border-[var(--color-border-soft)] shadow-[var(--shadow-sm)]">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md"
        >
          <ShieldAlert className="w-6 h-6 text-[var(--color-brand)]" aria-hidden="true" />
          <span>FactStamp</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            if (link.protected && !user) return null
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md px-2 py-1',
                  isActive(link.path)
                    ? 'text-[var(--color-brand)]'
                    : 'text-[var(--color-fg-2)] hover:text-[var(--color-fg)]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            intent="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </Button>

          {/* Notification Bell */}
          {user && <NotificationBell />}

          {/* User Menu */}
          {user ? (
            <>
              <Link to="/submit" className="hidden lg:block">
                <Button intent="primary" size="sm">
                  Submit claim
                </Button>
              </Link>

              {/* User indicator — desktop link to profile */}
              <Link
                to="/profile"
                className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-soft)] hover:bg-[var(--color-brand-subtle)] hover:border-[var(--color-brand-subtle)] transition-all cursor-pointer"
                title={`${user.displayName} — ${user.reputation}% reputation (View Profile)`}
              >
                <Avatar initials={user.displayName.charAt(0)} size="sm" />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-[var(--color-fg)] truncate max-w-[100px]">
                    {user.displayName}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-fg-muted)]">
                    <Star className="w-2.5 h-2.5 text-[var(--color-brand)]" aria-hidden="true" />
                    {user.reputation}%
                  </span>
                </div>
              </Link>

              <Button
                intent="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Link to="/signin">
              <Button intent="primary" size="sm">
                Sign in
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            ref={toggleRef}
            intent="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* Backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[60px] z-30 bg-black/30 backdrop-blur-sm lg:hidden animate-fade-in"
          aria-hidden="true"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Drawer — slides in from right */}
      <div
        ref={drawerRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="Mobile navigation"
        className={cn(
          'fixed top-[60px] right-0 z-40 h-[calc(100dvh-60px)] w-full sm:w-80',
          'bg-[var(--color-surface)] border-l border-[var(--color-border-soft)]',
          'shadow-[var(--shadow-xl)] lg:hidden',
          'flex flex-col',
          'transition-transform duration-[250ms] ease-out',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {navLinks.map((link) => {
            if (link.protected && !user) return null
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 py-3 px-4 rounded-lg text-base font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                  isActive(link.path)
                    ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand)]'
                    : 'text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isActive(link.path)
                    ? 'bg-[var(--color-brand)]'
                    : 'bg-[var(--color-fg-muted)]'
                )} />
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Bottom section — user info + actions */}
        {user && (
          <div className="border-t border-[var(--color-border-soft)] px-4 py-5 space-y-4 flex-shrink-0">
            {/* User info link */}
            <Link
              to="/profile"
              onClick={closeMobile}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
              title="View Profile"
            >
              <Avatar initials={user.displayName.charAt(0)} size="md" online />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-fg)] truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-[var(--color-fg-2)]">
                  <Star className="w-3 h-3 inline-block text-[var(--color-brand)] -mt-0.5 me-0.5" aria-hidden="true" />
                  {user.reputation}% — {user.totalVerifications} checks
                </p>
              </div>
            </Link>

            {/* Mobile Submit CTA */}
            <Link to="/submit" onClick={closeMobile}>
              <Button intent="primary" className="w-full">
                Submit claim
              </Button>
            </Link>

            <button
              onClick={() => {
                handleLogout()
                closeMobile()
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-base font-medium text-[var(--color-fg-2)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}

        {/* Bottom section — logged out */}
        {!user && (
          <div className="border-t border-[var(--color-border-soft)] px-4 py-5 flex-shrink-0">
            <Link to="/signin" onClick={closeMobile}>
              <Button intent="primary" className="w-full">
                Sign in
              </Button>
            </Link>
            <p className="mt-3 text-center text-xs text-[var(--color-fg-muted)]">
              Track your claims and earn reputation
            </p>
          </div>
        )}
      </div>
    </nav>
  )
}
