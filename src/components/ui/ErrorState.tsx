import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Couldn't load your data",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <AlertCircle className="w-12 h-12 text-[var(--color-v-false)] mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-[var(--color-fg)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-2)]">{message}</p>
      {onRetry && (
        <Button intent="secondary" onClick={onRetry} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  )
}
