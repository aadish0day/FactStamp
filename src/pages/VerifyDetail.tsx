import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, HelpCircle, RefreshCw, type LucideIcon } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { TrustRing } from '@/components/ui/TrustRing'
import { SourceQualityDot } from '@/components/ui/SourceQualityDot'
import { VerdictStamp } from '@/components/VerdictStamp'
import { ErrorState } from '@/components/ui/ErrorState'
import { useClaims } from '@/contexts/ClaimsContext'
import { useAuth } from '@/contexts/AuthContext'
import { determineSourceQuality } from '@/lib/confidenceScore'
import { cn } from '@/lib/utils'
import { VERDICT_META, type Verdict, type SourceQuality } from '@/lib/types'

const VERDICT_ICONS: Record<Verdict, LucideIcon> = {
  TRUE: CheckCircle2,
  FALSE: XCircle,
  MISLEADING: AlertTriangle,
  UNVERIFIABLE: HelpCircle,
  CONTESTED: RefreshCw,
}

const ALL_VERDICTS: Verdict[] = ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIABLE']

const SOURCE_QUALITY_HINT: Record<SourceQuality, string> = {
  high: 'High-quality source (government, WHO, Wikipedia)',
  medium: 'Credible source (established news outlet)',
  low: 'Unverified source — consider using a more authoritative reference',
}

export function VerifyDetail() {
  const { claimId } = useParams<{ claimId: string }>()
  const navigate = useNavigate()
  const { getClaimById, addVerification } = useClaims()
  const { user } = useAuth()

  const claim = claimId ? getClaimById(claimId) : undefined

  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [explanation, setExplanation] = useState('')
  const [sourceQuality, setSourceQuality] = useState<SourceQuality>('medium')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const updateSourceQuality = useCallback((url: string) => {
    setSourceQuality(determineSourceQuality(url))
  }, [])

  if (!claim) {
    return (
      <ErrorState
        title="Claim not found"
        message="The claim you're looking for doesn't exist or has been removed."
        onRetry={() => navigate('/verify')}
      />
    )
  }

  // ── Check if the claim has been auto-contested (7-day timeout) ──
  const now = new Date()
  const deadlineDate = new Date(claim.consensusDeadline)
  const isExpired = claim.status === 'pending' && deadlineDate <= now
  const deadlinePassed = claim.verdict === 'CONTESTED' && claim.verificationCount < 3

  if (isExpired || deadlinePassed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="hairline-card p-12 flex flex-col items-center gap-6">
          <RefreshCw className="w-14 h-14 text-[var(--color-v-contested)]" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-fg)]">Consensus deadline passed</h2>
            <p className="text-sm text-[var(--color-fg-2)] mt-2 max-w-sm mx-auto leading-relaxed">
              This claim did not receive the minimum 3 independent verifications within the 7-day window. It has been automatically marked as <strong>CONTESTED</strong>.
            </p>
          </div>

          <div className="w-full max-w-sm mx-auto py-4 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)]">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-10 h-10 text-[var(--color-v-contested)]" aria-hidden="true" />
              <span className="text-xl font-bold uppercase tracking-tight text-[var(--color-v-contested)]">
                CONTESTED
              </span>
              <p className="text-xs text-[var(--color-fg-muted)]">
                {claim.verificationCount} of 3 required verifications — deadline was {formatDistanceToNow(deadlineDate, { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-2">
            <Button intent="primary" onClick={() => navigate('/verify')}>
              Back to verification queue
            </Button>
            <Button intent="secondary" onClick={() => navigate(`/claim/${claim.id}`)}>
              View claim details
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    const needsMore = (claim.verificationCount + 1) < 3
    const consensusText = needsMore
      ? `This claim needs ${3 - (claim.verificationCount + 1)} more verification${3 - (claim.verificationCount + 1) !== 1 ? 's' : ''} before reaching consensus.`
      : 'The claim has reached 3 verifications and a consensus verdict will be displayed.'

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="hairline-card p-12 flex flex-col items-center gap-6">
          <CheckCircle2 className="w-12 h-12 text-[var(--color-v-true)]" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-fg)]">Verdict submitted!</h2>
            <p className="text-sm text-[var(--color-fg-2)] mt-1">{consensusText}</p>
          </div>

          {/* Preview the final verdict card with the tilted stamp */}
          <div className="w-full max-w-sm mx-auto my-2 py-4 rounded-[var(--radius-lg)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] overflow-hidden">
            <VerdictStamp verdict={verdict!} confidenceLabel="Pending consensus" />
          </div>

          <p className="text-xs text-[var(--color-fg-muted)]">
            This is how your verdict will appear on the claim detail page.
          </p>

          <div className="flex gap-4 justify-center pt-2">
            <Button intent="primary" onClick={() => navigate(`/claim/${claim.id}`)}>
              View claim details
            </Button>
            <Button intent="secondary" onClick={() => navigate('/verify')}>
              Back to queue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}
    if (!verdict) newErrors.verdict = 'Please select a verdict'

    if (!sourceUrl.trim()) {
      newErrors.sourceUrl = 'Please provide a source URL'
    } else {
      try {
        new URL(sourceUrl)
      } catch {
        newErrors.sourceUrl = 'Please enter a valid URL (e.g., https://example.com)'
      }
    }

    if (explanation.trim().length < 50) {
      newErrors.explanation = `Explanation must be at least 50 characters (${explanation.trim().length}/50)`
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors', {
        description: Object.values(newErrors)[0],
      })
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))

    addVerification(claim.id, {
      verdict: verdict!,
      sourceUrl: sourceUrl.trim(),
      explanation: explanation.trim(),
      verifierId: user?.uid || 'u1',
      verifierName: user?.displayName || 'Anonymous',
      verifierReputation: user?.reputation || 50,
    })

    setLoading(false)
    toast.success('Verdict submitted', {
      description: `Your verdict for "${claim.text.slice(0, 60)}${claim.text.length > 60 ? '…' : ''}" has been recorded.`,
      icon: <CheckCircle2 className="w-5 h-5 text-[var(--color-v-true)]" />,
    })
    setSubmitted(true)
  }

  const [rulesOpen, setRulesOpen] = useState(true)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Seo title="Submit a Verdict" description={`Fact-checking claim: ${claim.text.slice(0, 80)}`} />
      <Breadcrumbs currentLabel="Submit verdict" />

      {/* Verifier Rules banner */}
      {rulesOpen && (
        <div className="mb-6 p-4 rounded-[var(--radius-md)] border animate-pop-in"
          style={{
            backgroundColor: 'var(--color-v-mislead-bg)',
            borderColor: 'color-mix(in srgb, var(--color-v-mislead) 25%, transparent)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-v-mislead)' }} aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-v-mislead)' }}>
                  Verifier Rules
                </p>
                <ul className="mt-1.5 flex flex-col gap-1 text-xs text-[var(--color-fg-2)] list-disc list-inside">
                  <li>Don&apos;t look up other verdicts before submitting</li>
                  <li>Always cite a credible source</li>
                  <li>Be objective, not emotional</li>
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRulesOpen(false)}
              className="flex-shrink-0 bg-transparent border-none cursor-pointer text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors p-0.5"
              aria-label="Dismiss verifier rules"
            >
              <XCircle className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Claim Display (read-only) */}
      <div className="hairline-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <CategoryBadge category={claim.category} />
          <span className="text-xs text-[var(--color-fg-muted)] font-mono tabular-nums">
            Submitted by {claim.submittedByName}
          </span>
        </div>
        <p className="text-lg text-[var(--color-fg)] leading-relaxed">
          {claim.text}
        </p>
      </div>

      {/* Verification Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Verdict Selection */}
        <fieldset>
          <legend className="text-lg font-semibold text-[var(--color-fg)] mb-4">
            Your verdict
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ALL_VERDICTS.map((v) => {
              const Icon = VERDICT_ICONS[v]
              const meta = VERDICT_META[v]
              return (
                <label
                  key={v}
                  className={cn(
                    'flex flex-col items-center gap-3 p-4 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all',
                    'focus-within:ring-2 focus-within:ring-[var(--color-accent)]',
                    verdict === v
                      ? 'border-current shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border)]'
                  )}
                  style={{
                    color: verdict === v ? `var(${meta.colorVar})` : undefined,
                    backgroundColor: verdict === v ? `var(${meta.bgVar})` : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="verdict"
                    value={v}
                    checked={verdict === v}
                    onChange={(e) => setVerdict(e.target.value as Verdict)}
                    className="sr-only"
                  />
                  <Icon className="w-8 h-8" aria-hidden="true" />
                  <span className="text-sm font-semibold">{meta.label}</span>
                </label>
              )
            })}
          </div>
          {errors.verdict && (
            <p className="mt-2 flex items-center gap-1 text-sm text-[var(--color-v-false)]">
              <AlertCircle className="w-4 h-4" />
              {errors.verdict}
            </p>
          )}
        </fieldset>

        {/* Source URL */}
        <div>
          <label htmlFor="source-url" className="block text-sm font-medium text-[var(--color-fg)] mb-2">
            Source URL
          </label>
          <div className="relative">
            <Input
              id="source-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://who.int/dengue-treatment..."
              value={sourceUrl}
              onChange={(e) => {
                setSourceUrl(e.target.value)
                updateSourceQuality(e.target.value)
                if (errors.sourceUrl) setErrors((prev) => ({ ...prev, sourceUrl: '' }))
              }}
              error={!!errors.sourceUrl}
              aria-invalid={!!errors.sourceUrl}
              aria-describedby={errors.sourceUrl ? 'source-error' : 'source-quality'}
              className="pr-10"
            />
            {/* Source Quality Dot */}
            {sourceUrl && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <SourceQualityDot quality={sourceQuality} />
              </div>
            )}
          </div>
          {errors.sourceUrl ? (
            <p id="source-error" className="mt-1.5 flex items-center gap-1 text-sm text-[var(--color-v-false)]">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              {errors.sourceUrl}
            </p>
          ) : (
            <p id="source-quality" className="mt-1.5 text-xs text-[var(--color-fg-muted)]">
              {sourceUrl ? SOURCE_QUALITY_HINT[sourceQuality] : 'Paste a URL to check source quality'}
            </p>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-[var(--color-fg)] mb-2">
            Explanation
          </label>
          <Textarea
            id="explanation"
            placeholder="Explain your verdict in plain language. What did you find? Why does the source support your verdict?"
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value)
              if (errors.explanation) setErrors((prev) => ({ ...prev, explanation: '' }))
            }}
            error={!!errors.explanation}
            rows={5}
            aria-describedby="explanation-error"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span
              className={cn(
                'text-xs font-mono tabular-nums',
                explanation.trim().length < 50 ? 'text-[var(--color-fg-muted)]' : 'text-[var(--color-fg-2)]'
              )}
            >
              {explanation.trim().length} characters (min 50)
            </span>
            {errors.explanation && (
              <span id="explanation-error" className="text-xs text-[var(--color-v-false)]">
                {errors.explanation}
              </span>
            )}
          </div>
        </div>

        {/* Your Reputation Preview */}
        {user && (
          <div className="hairline-card p-4 bg-[var(--color-accent-subtle)]">
            <div className="flex items-center gap-3">
              <TrustRing
                reputation={user.reputation}
                size={48}
                initials={user.displayName[0]}
              />
              <div>
                <p className="text-sm font-medium text-[var(--color-fg)]">
                  Your reputation: <span className="font-mono tabular-nums">{user.reputation}</span>
                </p>
                <p className="text-xs text-[var(--color-fg-2)]">
                  {user.totalVerifications} verifications submitted
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          intent="primary"
          size="lg"
          className="w-full"
          disabled={!verdict || !sourceUrl.trim() || explanation.trim().length < 50 || loading}
          loading={loading}
        >
          Submit your verdict
        </Button>
      </form>
    </div>
  )
}
