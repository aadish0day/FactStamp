import { Navigate, useLocation, type Location } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Show a spinner while auth is initializing (future-proof for session persistence)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)] animate-spin" />
          <span className="text-sm text-[var(--color-fg-muted)]">Verifying access…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to sign-in, preserving the intended destination
    return (
      <Navigate
        to="/signin"
        state={{ from: location as Location }}
        replace
      />
    )
  }

  return <>{children}</>
}
