import { lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ClaimsProvider } from '@/contexts/ClaimsContext'
import { UsersProvider } from '@/contexts/UsersContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Navbar } from '@/components/Navbar'
import { OnlineStatusBar } from '@/components/OnlineStatusBar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'
import { Footer } from '@/components/Footer'

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const SignIn = lazy(() => import('@/pages/SignIn').then((m) => ({ default: m.SignIn })))
const SignUp = lazy(() => import('@/pages/SignUp').then((m) => ({ default: m.SignUp })))
const Submit = lazy(() => import('@/pages/Submit').then((m) => ({ default: m.Submit })))
const ClaimDetail = lazy(() => import('@/pages/ClaimDetail').then((m) => ({ default: m.ClaimDetail })))
const VerifyQueue = lazy(() => import('@/pages/VerifyQueue').then((m) => ({ default: m.VerifyQueue })))
const VerifyDetail = lazy(() => import('@/pages/VerifyDetail').then((m) => ({ default: m.VerifyDetail })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const Admin = lazy(() => import('@/pages/Admin').then((m) => ({ default: m.Admin })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <ClaimsProvider>
            <UsersProvider>
              <NotificationsProvider>
                <ErrorBoundary>
                  <AppShell />
                  <Toaster
                    position="top-right"
                    closeButton
                    gap={8}
                    visibleToasts={3}
                    toastOptions={{
                      style: {
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-fg)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </ErrorBoundary>
              </NotificationsProvider>
            </UsersProvider>
          </ClaimsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

function AppShell() {
  const { pathname } = useLocation()
  // The admin console is a standalone, staff-only interface: it has its own
  // full-screen auth gate and chrome, so it must NOT render the public navbar
  // and footer (which are the "normal user" layout).
  const isStandalonePage =
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      {/* Skip-to-content link — first focusable element */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      {!isStandalonePage && <Navbar />}
      <OnlineStatusBar />
                <main id="main-content" tabIndex={-1} aria-live="polite" aria-atomic="true">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)] animate-spin" />
                          <span className="text-sm text-[var(--color-fg-muted)]">Loading…</span>
                        </div>
                      </div>
                    }
                  >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/submit" element={<ProtectedRoute><Submit /></ProtectedRoute>} />
                    <Route path="/claim" element={<Navigate to="/verify" replace />} />
                    <Route path="/claims" element={<Navigate to="/verify" replace />} />
                    <Route path="/claim/:claimId" element={<ClaimDetail />} />
                    <Route path="/verify" element={<ProtectedRoute><VerifyQueue /></ProtectedRoute>} />
                    <Route path="/verify/:claimId" element={<ProtectedRoute><VerifyDetail /></ProtectedRoute>} />
                    {/* Public dashboard — Module 7: all users can view without auth */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    {/* Unlisted staff console — direct URL access only */}
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </main>
                {!isStandalonePage && <Footer />}
            </div>
  )
}
