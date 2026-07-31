import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

// ── Props ──
interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback. Receives error + retry fn. */
  fallback?: (error: Error, retry: () => void) => ReactNode
}

// ── State ──
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ── Fallback UI (inner component to use hooks) ──
function FallbackContent({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const navigate = useNavigate()

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[60dvh] px-6 py-16 text-center"
    >
      {/* Icon */}
      <div className="mb-6 relative">
        <div className="w-16 h-16 rounded-full bg-[var(--color-v-false-bg)] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[var(--color-v-false)]" aria-hidden="true" />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-[var(--color-fg)]">
        Something went wrong
      </h1>

      {/* Message */}
      <p className="mt-3 max-w-md text-sm text-[var(--color-fg-2)] leading-relaxed">
        We encountered an unexpected error. It's probably temporary — you can try again,
        or head back to the homepage.
      </p>

      {/* Error detail (dev-only) */}
      {import.meta.env.DEV && error && (
        <details className="mt-4 max-w-lg w-full text-left">
          <summary className="cursor-pointer text-xs font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg-2)] transition-colors">
            Error details
          </summary>
          <pre className="mt-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-xs text-[var(--color-v-false)] font-mono overflow-auto whitespace-pre-wrap">
            {error.name}: {error.message}
            {'\n'}
            {error.stack}
          </pre>
        </details>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Button intent="primary" onClick={onRetry} className="min-w-[140px]">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </Button>
        <Button intent="secondary" onClick={() => navigate('/')}>
          <Home className="w-4 h-4" aria-hidden="true" />
          Go home
        </Button>
      </div>
    </div>
  )
}

// ── ErrorBoundary Class ──
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console with debug info
    console.groupCollapsed('🚨 FactStamp Error Boundary caught an error')
    console.error('Error:', error)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()
  }

  /** Reset error state to attempt recovery */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Custom fallback provided via props
      if (fallback) {
        return fallback(error, this.handleRetry)
      }

      // Default branded fallback
      return <FallbackContent error={error} onRetry={this.handleRetry} />
    }

    return children
  }
}
