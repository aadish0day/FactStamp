import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MailCheck, RefreshCw, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

const RESEND_COOLDOWN_S = 60

/**
 * Shown in place of the submit / verdict forms to signed-in users whose email
 * is unverified. Firestore rules refuse their writes anyway; this explains why.
 */
export function VerifyEmailNotice({ action = 'submit claims and cast verdicts' }: { action?: string }) {
  const { user, resendVerification, refreshVerification } = useAuth()
  const [cooldown, setCooldown] = useState(0)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const resend = async () => {
    setSending(true)
    try {
      await resendVerification()
      toast.success('Verification email sent', { description: `Check ${user?.email || 'your inbox'} (and spam).` })
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      toast.error('Could not send email', { description: err instanceof Error ? err.message : 'Please try again.' })
      setCooldown(RESEND_COOLDOWN_S)
    } finally {
      setSending(false)
    }
  }

  const check = async () => {
    setChecking(true)
    try {
      if (await refreshVerification()) {
        toast.success('Email verified', { description: 'You can now take part in fact-checks.' })
      } else {
        toast.error('Not verified yet', { description: 'Open the link in the email we sent, then try again.' })
      }
    } catch (err) {
      toast.error('Could not check status', { description: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      role="status"
      className="p-5 sm:p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)]">
          <MailCheck className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--color-fg)]">Verify your email to {action}</h2>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Verified emails keep verdicts honest — one person, one vote. We sent a link to{' '}
            <span className="font-medium text-[var(--color-fg-2)]">{user?.email || 'your email'}</span>. Open it, then come back
            and press &ldquo;I&rsquo;ve verified&rdquo;.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button intent="primary" size="sm" onClick={check} loading={checking}>
          {!checking && <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          I&rsquo;ve verified
        </Button>
        <Button intent="secondary" size="sm" onClick={resend} loading={sending} disabled={cooldown > 0}>
          {!sending && <Send className="w-3.5 h-3.5" aria-hidden="true" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </Button>
      </div>
    </div>
  )
}
