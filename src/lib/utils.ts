import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ── Relative Time Formatter ── */

export function formatDistanceToNow(
  dateInput: string | Date | number,
  _options?: { addSuffix?: boolean }
): string {
  const date = new Date(dateInput)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'less than a minute ago'
  if (diffMin === 1) return '1 minute ago'
  if (diffMin < 60) return `${diffMin} minutes ago`
  if (diffHour === 1) return 'about 1 hour ago'
  if (diffHour < 24) return `about ${diffHour} hours ago`
  if (diffDay === 1) return '1 day ago'
  if (diffDay < 30) return `${diffDay} days ago`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth === 1) return '1 month ago'
  if (diffMonth < 12) return `${diffMonth} months ago`
  const diffYear = Math.floor(diffDay / 365)
  return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`
}
