import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const LABEL_MAP: Record<string, string> = {
  verify: 'Verify Queue',
  claim: 'Claim',
  dashboard: 'Dashboard',
  submit: 'Submit',
  signin: 'Sign In',
  signup: 'Sign Up',
}

interface BreadcrumbsProps {
  className?: string
  /** Override the last segment label (e.g. claim text) */
  currentLabel?: string
}

export function Breadcrumbs({ className, currentLabel }: BreadcrumbsProps) {
  const { pathname } = useLocation()

  // Split path into segments, filter empty
  const segments = pathname.split('/').filter(Boolean)

  // Don't show breadcrumbs on the home page
  if (segments.length === 0) return null

  // Hide on auth pages
  if (segments[0] === 'signin' || segments[0] === 'signup') return null

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1

    // Try label map first, then use the segment itself (capitalized)
    let label = LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    // Detect if this segment is a dynamic claim or verification ID (e.g., Firebase ID or demo ID)
    const parentSegment = index > 0 ? segments[index - 1] : ''
    const isIdSegment = parentSegment === 'claim' || parentSegment === 'verify' || segment.startsWith('c') || segment.startsWith('v')

    if (isIdSegment) {
      label = isLast && currentLabel ? currentLabel : parentSegment === 'verify' ? 'Submit Verdict' : 'Claim Details'
    }

    return { href, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className={cn('container mx-auto px-[clamp(1rem,4vw,3rem)] pt-4', className)}>
      <ol className="flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)]">
        <li>
          <Link
            to="/"
            className="inline-flex items-center gap-1 hover:text-[var(--color-fg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-[var(--color-fg-soft)]" aria-hidden="true" />
            {crumb.isLast ? (
              <span
                className={cn(
                  'text-[var(--color-fg-2)] font-medium truncate max-w-[200px]',
                  crumb.label.startsWith('#') && 'font-mono'
                )}
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="hover:text-[var(--color-fg)] transition-colors truncate max-w-[150px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-sm"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
