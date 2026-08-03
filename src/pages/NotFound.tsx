import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <Seo title="Page Not Found" description="The page you're looking for has been debunked — or it never existed." />
      <ShieldAlert className="w-20 h-20 text-[var(--color-fg-muted)] mx-auto mb-6" aria-hidden="true" />
      <h1 className="text-4xl font-bold text-[var(--color-fg)] mb-4">
        This claim doesn't exist
      </h1>
      <p className="text-[var(--color-fg-2)] max-w-md mx-auto mb-8">
        The page you're looking for has been debunked — or it never existed in the first place.
      </p>
      <div className="flex gap-4 justify-center">
        <Button intent="primary" size="lg" onClick={() => navigate('/')}>
          Go home
        </Button>
        <Button intent="ghost" size="lg" onClick={() => navigate('/dashboard')}>
          View dashboard
        </Button>
      </div>
    </div>
  )
}
