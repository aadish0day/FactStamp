import { ShieldCheck, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon = ShieldCheck, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <Icon className="w-12 h-12 text-[var(--color-fg-muted)] mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-[var(--color-fg)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-fg-2)]">{description}</p>
      {action && (
        <Button intent="primary" onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  )
}
