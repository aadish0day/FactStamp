import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { validateVerdictExplanation, sanitizeTextInput } from '@/lib/security'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { SourceQualityDot } from '@/components/ui/SourceQualityDot'
import { VerdictStamp } from '@/components/VerdictStamp'
import { ErrorState } from '@/components/ui/ErrorState'
import { useClaims } from '@/contexts/ClaimsContext'
import { useAuth } from '@/contexts/AuthContext'
import { determineSourceQuality } from '@/lib/confidenceScore'
import { cn, formatDistanceToNow } from '@/lib/utils'
import { VERDICT_META, type Verdict, type SourceQuality } from '@/lib/types'

const VERDICT_ICONS: Record<Verdict, LucideIcon> = {
  TRUE: CheckCircle2,
  FALSE: XCircle,
  MISLEADING: AlertTriangle,
  UNVERIFIABLE: HelpCircle,
  CONTESTED: RefreshCw,
}

const ALL_VERDICTS: Verdict[] = ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIABLE']

const SOURCE_QUALITY_LABELS: Record<SourceQuality, { title: string; desc: string }> = {
  high: {
    title: 'Tier 1 Authoritative Source',
    desc: 'Government portal, WHO, official gazette, or academic study',
  },
  medium: {
    title: 'Tier 2 Established Press',
    desc: 'Reputable news outlet or investigative reporting',
  },
  low: {
    title: 'Secondary / Community Reference',
    desc: 'Unindexed blog or social link — consider an official source for higher consensus weight',
  },
}

function timeRemaining(deadline: string): {
  label: string
  urgent: boolean
  expired: boolean
} {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffMs = deadlineDate.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { label: 'Consensus window closed', urgent: false, expired: true }
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return { label: `${days}d ${hours}h remaining`, urgent: false, expired: false }
  }
  if (hours > 0) {
    return { label: `${hours}h remaining`, urgent: hours <= 8, expired: false }
  }
  const minutes = Math.floor(diffMs / (1000 * 60))
  return { label: `${minutes}m remaining`, urgent: true, expired: false }
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
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <ErrorState
          title="Claim not found"
          message="The claim you are looking for does not exist or has been removed."
          onRetry={() => navigate('/verify')}
        />
      </div>
    )
  }

  // Check if claim consensus window passed
  const now = new Date()
  const deadlineDate = new Date(claim.consensusDeadline)
  const isExpired = claim.status === 'pending' && deadlineDate <= now
  const deadlinePassed = claim.verdict === 'CONTESTED' && claim.verificationCount < 3

  if (isExpired || deadlinePassed) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl text-center">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <RefreshCw className="w-12 h-12 text-[var(--color-v-contested)] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--color-fg)] mb-2">Consensus Window Closed</h1>
          <p className="text-sm text-[var(--color-fg-2)] mb-6 leading-relaxed">
            This claim did not receive the required 3 independent peer verifications within the 7-day period. It has been marked as <strong>CONTESTED</strong>.
          </p>

          <div className="flex gap-3 justify-center">
            <Button intent="primary" onClick={() => navigate('/verify')}>
              Return to Queue
            </Button>
            <Button intent="outline" onClick={() => navigate(`/claim/${claim.id}`)}>
              View Claim Details
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Submission success screen
  if (submitted) {
    const totalCount = claim.verificationCount + 1
    const needsMore = totalCount < 3

    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--color-fg)]">Verdict Recorded</h1>
            <p className="text-sm text-[var(--color-fg-2)] mt-2 leading-relaxed">
              {needsMore
                ? `Thank you for reviewing this claim. ${3 - totalCount} more independent verdict${3 - totalCount !== 1 ? 's' : ''} needed to achieve community consensus.`
                : 'Consensus reached! 3 independent community verifications have been recorded.'}
            </p>
          </div>

          <div className="py-3 px-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/50">
            <VerdictStamp verdict={verdict!} confidenceLabel="Pending consensus" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button intent="primary" onClick={() => navigate('/verify')}>
              Verify Another Claim
            </Button>
            <Button intent="outline" onClick={() => navigate(`/claim/${claim.id}`)}>
              View Live Claim Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!verdict) newErrors.verdict = 'Please select a verdict rating.'

    if (!sourceUrl.trim()) {
      newErrors.sourceUrl = 'Please provide a valid source URL.'
    } else {
      try {
        const parsed = new URL(sourceUrl.trim())
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          newErrors.sourceUrl = 'Only standard HTTP or HTTPS links are permitted.'
        }
      } catch {
        newErrors.sourceUrl = 'Please enter a valid URL (e.g. https://pib.gov.in).'
      }
    }

    const cleanExplanation = sanitizeTextInput(explanation.trim())
    const explValidation = validateVerdictExplanation(cleanExplanation, claim.text)
    if (!explValidation.valid) {
      newErrors.explanation = explValidation.error || 'Please provide a detailed explanation of your findings.'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please resolve the errors below before submitting.')
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))

    addVerification(claim.id, {
      verdict: verdict!,
      sourceUrl: sourceUrl.trim(),
      explanation: cleanExplanation,
      verifierId: user?.uid || '',
      verifierName: user?.displayName || 'Independent Verifier',
      verifierReputation: user?.reputation || 50,
    })

    setLoading(false)
    toast.success('Verdict recorded successfully.')
    setSubmitted(true)
  }

  const deadline = timeRemaining(claim.consensusDeadline)
  const trimmedExpl = explanation.trim()
  const wordsCount = trimmedExpl ? trimmedExpl.split(/\s+/).filter(Boolean).length : 0
  const charProgress = Math.min(100, Math.round((trimmedExpl.length / 50) * 100))
  const isLengthMet = trimmedExpl.length >= 50 && wordsCount >= 8

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Seo
        title={`Verify Claim #${claim.id.toUpperCase()} — FactStamp`}
        description={`Fact-checking claim: ${claim.text.slice(0, 80)}`}
      />
      <Breadcrumbs currentLabel="Submit Verdict" />

      {/* ── Case Dossier Brief (The Claim Under Review) ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--color-border-soft)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-fg-muted)]">
              Case #{claim.id.toUpperCase()}
            </span>
            <span className="text-[var(--color-border)]">•</span>
            <CategoryBadge category={claim.category} />
          </div>

          <div className="flex items-center gap-1 text-xs font-mono text-[var(--color-fg-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span className={cn(deadline.urgent && 'text-amber-600 dark:text-amber-400 font-bold')}>
              {deadline.label}
            </span>
          </div>
        </div>

        {/* Claim Text (Headline Hero) */}
        <div className="py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)] mb-2">
            Claim Under Review
          </p>
          <blockquote className="text-lg sm:text-xl font-semibold text-[var(--color-fg)] leading-relaxed">
            &ldquo;{claim.text}&rdquo;
          </blockquote>
        </div>

        {/* Attached Screenshot Evidence */}
        {claim.imageUrl && (
          <div className="mt-2 pt-4 border-t border-[var(--color-border-soft)]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-[var(--color-fg-2)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                Attached WhatsApp Forward Screenshot
              </span>
              <a
                href={claim.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
              >
                Open original <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/60 max-h-80 p-2 flex justify-center">
              <img
                src={claim.imageUrl}
                alt="Viral WhatsApp forward screenshot"
                className="max-h-72 w-auto object-contain rounded"
              />
            </div>
          </div>
        )}

        {/* Consensus Triage Info */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border-soft)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-fg-muted)] font-mono">
          <span>
            {claim.verificationCount} of 3 verifications recorded
          </span>
          <span>
            Reported by {claim.submittedByName || 'Citizen'} {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
          </span>
        </div>
      </section>

      {/* ── Verification Form or Auth Gate ── */}
      {!user ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand)] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-fg)] mb-1">
            Sign In to Verify
          </h2>
          <p className="text-xs text-[var(--color-fg-2)] max-w-md mx-auto mb-5 leading-relaxed">
            Independent peer review requires a registered verifier account to prevent coordinated manipulation and maintain community trust.
          </p>
          <div className="flex gap-3 justify-center max-w-xs mx-auto">
            <Button
              intent="primary"
              className="flex-1 font-bold"
              onClick={() => navigate('/signin', { state: { from: `/verify/${claim.id}` } })}
            >
              Sign In
            </Button>
            <Button
              intent="outline"
              className="flex-1 font-semibold"
              onClick={() => navigate('/signup', { state: { from: `/verify/${claim.id}` } })}
            >
              Sign Up
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Step 1: Verdict Selection */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold uppercase tracking-wider text-[var(--color-fg)]">
              Step 1: Select Verdict Rating <span className="text-[var(--color-v-false)]">*</span>
            </legend>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Cast your independent assessment based on the factual evidence you located:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_VERDICTS.map((v) => {
                const Icon = VERDICT_ICONS[v]
                const meta = VERDICT_META[v]
                const isSelected = verdict === v

                return (
                  <motion.label
                    key={v}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'relative flex flex-col items-center gap-2.5 p-3.5 rounded-[var(--radius-md)] border cursor-pointer select-none transition-colors text-center',
                      isSelected
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)] shadow-sm'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]'
                    )}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value={v}
                      checked={isSelected}
                      onChange={(e) => setVerdict(e.target.value as Verdict)}
                      className="sr-only"
                    />
                    <Icon
                      className={cn(
                        'w-6 h-6 transition-transform',
                        isSelected ? 'text-[var(--color-brand)] scale-110' : 'text-[var(--color-fg-muted)]'
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'text-xs font-bold tracking-tight',
                        isSelected ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-2)]'
                      )}
                    >
                      {meta.label}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-brand)]" />
                    )}
                  </motion.label>
                )
              })}
            </div>

            {errors.verdict && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-v-false)]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.verdict}
              </p>
            )}
          </fieldset>

          {/* Step 2: Source Evidence URL */}
          <div className="space-y-2">
            <label htmlFor="source-url" className="block text-sm font-bold uppercase tracking-wider text-[var(--color-fg)]">
              Step 2: Source Evidence URL <span className="text-[var(--color-v-false)]">*</span>
            </label>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Link to an official government circular, press release, WHO alert, or credible investigative report:
            </p>

            <div className="relative">
              <Input
                id="source-url"
                type="url"
                placeholder="https://pib.gov.in/... or https://who.int/news/..."
                value={sourceUrl}
                onChange={(e) => {
                  setSourceUrl(e.target.value)
                  updateSourceQuality(e.target.value)
                  if (errors.sourceUrl) setErrors((prev) => ({ ...prev, sourceUrl: '' }))
                }}
                error={!!errors.sourceUrl}
                aria-invalid={!!errors.sourceUrl}
                aria-describedby={errors.sourceUrl ? 'source-error' : undefined}
                className="pr-10 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
              />
              {sourceUrl && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <SourceQualityDot quality={sourceQuality} />
                </div>
              )}
            </div>

            {/* Source Evaluation Feedback */}
            {errors.sourceUrl ? (
              <p id="source-error" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-v-false)]">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.sourceUrl}
              </p>
            ) : sourceUrl.trim() ? (
              <div className="flex items-center justify-between text-xs p-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/60 text-[var(--color-fg-2)]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      sourceQuality === 'high'
                        ? 'bg-emerald-500'
                        : sourceQuality === 'medium'
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    )}
                  />
                  <span className="font-semibold">{SOURCE_QUALITY_LABELS[sourceQuality].title}</span>
                  <span className="text-[var(--color-fg-muted)] hidden sm:inline">•</span>
                  <span className="text-[11px] text-[var(--color-fg-muted)] hidden sm:inline">
                    {SOURCE_QUALITY_LABELS[sourceQuality].desc}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-fg-muted)]">
                  {sourceQuality === 'high' ? 'High Weight' : sourceQuality === 'medium' ? 'Standard' : 'Low Weight'}
                </span>
              </div>
            ) : null}
          </div>

          {/* Step 3: Factual Analysis & Findings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="explanation" className="block text-sm font-bold uppercase tracking-wider text-[var(--color-fg)]">
                Step 3: Explanation & Findings <span className="text-[var(--color-v-false)]">*</span>
              </label>
              <span className="text-xs font-mono text-[var(--color-fg-muted)] tabular-nums">
                {trimmedExpl.length} / 1500 characters
              </span>
            </div>

            <p className="text-xs text-[var(--color-fg-muted)]">
              Explain in plain language what you found in the source and why it proves or disproves the viral forward.
            </p>

            <Textarea
              id="explanation"
              placeholder="e.g., The official gazette notification published on the Ministry portal contradicts this viral claim. The forwarded circular quotes an invalid order number and does not appear in official gazette archives..."
              value={explanation}
              maxLength={1500}
              onChange={(e) => {
                setExplanation(e.target.value)
                if (errors.explanation) setErrors((prev) => ({ ...prev, explanation: '' }))
              }}
              error={!!errors.explanation}
              aria-invalid={!!errors.explanation}
              aria-describedby={errors.explanation ? 'explanation-error' : undefined}
              rows={5}
              className="text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
            />

            {/* Subtle Character Progress Bar */}
            <div
              role="progressbar"
              aria-valuenow={Math.min(50, trimmedExpl.length)}
              aria-valuemin={0}
              aria-valuemax={50}
              aria-label="Progress toward minimum 50 characters"
              className="h-1 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden"
            >
              <div
                className={cn(
                  'h-full transition-all duration-150',
                  trimmedExpl.length >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                style={{ width: `${charProgress}%` }}
              />
            </div>

            {/* Live Requirements Check */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-mono text-[11px]',
                    trimmedExpl.length >= 50
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-[var(--color-fg-muted)]'
                  )}
                >
                  <Check className={cn('w-3 h-3', trimmedExpl.length >= 50 ? 'opacity-100' : 'opacity-30')} />
                  50+ characters ({trimmedExpl.length}/50)
                </span>

                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-mono text-[11px]',
                    wordsCount >= 8
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-[var(--color-fg-muted)]'
                  )}
                >
                  <Check className={cn('w-3 h-3', wordsCount >= 8 ? 'opacity-100' : 'opacity-30')} />
                  8+ words ({wordsCount}/8)
                </span>
              </div>

              {isLengthMet && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready
                </span>
              )}
            </div>

            {errors.explanation && (
              <p id="explanation-error" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-v-false)] pt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.explanation}
              </p>
            )}
          </div>

          {/* Submission Action Bar */}
          <div className="pt-4 border-t border-[var(--color-border-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[var(--color-fg-muted)]">
              <p className="font-medium text-[var(--color-fg-2)]">
                Recorded under your verified verifier ID.
              </p>
              <p className="text-[11px]">
                Requires 3 independent peer verifications to establish final community consensus.
              </p>
            </div>

            <Button
              type="submit"
              intent="primary"
              size="lg"
              disabled={!verdict || !sourceUrl.trim() || trimmedExpl.length < 50 || loading}
              loading={loading}
              className="font-bold flex-shrink-0"
            >
              Submit Verification Verdict
              <ArrowRight className="w-4 h-4 ms-1.5" />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

