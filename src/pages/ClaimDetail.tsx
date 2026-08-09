import { useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, ShieldCheck, Share2, Plus, RefreshCw, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'
import { toast } from 'sonner'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { VerdictPill } from '@/components/ui/VerdictPill'
import { Avatar } from '@/components/ui/Avatar'
import { SourceQualityDot } from '@/components/ui/SourceQualityDot'
import { VerdictStamp } from '@/components/VerdictStamp'
import { FactCheckCard } from '@/components/FactCheckCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ClaimDetailSkeleton } from '@/components/ui/Skeletons'
import { useClaims } from '@/contexts/ClaimsContext'
import { useAuth } from '@/contexts/AuthContext'
import { VERDICT_META } from '@/lib/types'
import { convertOklchInString } from '@/lib/utils'
import { toPng, toBlob } from 'html-to-image'

/**
 * All CSS variable names defined in the design system that may contain
 * oklch() or oklab() values. Listed explicitly because getComputedStyle indexed
 * access (cs[i]) does not reliably enumerate custom properties across
 * different browser implementations.
 */
const CSS_VARS_TO_PATCH = [
  '--color-bg','--color-surface','--color-surface-2',
  '--color-border','--color-border-soft',
  '--color-brand','--color-brand-hover','--color-brand-active',
  '--color-brand-subtle','--color-brand-fg',
  '--color-accent','--color-accent-hover','--color-accent-active',
  '--color-accent-subtle','--color-accent-fg',
  '--color-fg','--color-fg-2','--color-fg-muted','--color-fg-soft',
  '--color-v-true','--color-v-true-bg','--color-v-true-border',
  '--color-v-false','--color-v-false-bg','--color-v-false-border',
  '--color-v-mislead','--color-v-mislead-bg','--color-v-mislead-border',
  '--color-v-unverif','--color-v-unverif-bg','--color-v-unverif-border',
  '--color-v-contested','--color-v-contested-bg','--color-v-contested-border',
  '--color-sq-high','--color-sq-med','--color-sq-low',
  '--shadow-xs','--shadow-sm','--shadow-md','--shadow-lg','--shadow-xl',
  '--shadow-border','--shadow-border-hover',
]

/** Detail view for individual claim with verification timeline and share cards. */
export function ClaimDetail() {
  const { claimId } = useParams<{ claimId: string }>()
  const navigate = useNavigate()
  const { getClaimById } = useClaims()
  const { user } = useAuth()
  const [error, setError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const claim = claimId ? getClaimById(claimId) : undefined

  if (error) {
    return (
      <ErrorState
        title="Couldn't load this claim"
        message="Something went wrong while loading the claim details. Please try again."
        onRetry={() => {
          setError(false)
          window.location.reload()
        }}
      />
    )
  }

  if (!claim) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <Seo title="Claim Not Found" description="The claim you're looking for doesn't exist or may have been removed." />
        <ErrorState
          title="Claim not found"
          message="The claim you're looking for doesn't exist or may have been removed."
          onRetry={() => navigate('/verify')}
        />
      </div>
    )
  }

  /**
   * Patch every stylesheet rule in the document that contains oklch() or
   * oklab(), replacing those color functions with their standard sRGB
   * equivalents. Then return a restore function that reverts the rules.
   *
   * Why this is necessary: html2canvas builds a clone of the element in an
   * offscreen iframe and re-parses the original stylesheet CSS. If any CSS
   * rule anywhere contains oklch()/oklab() — whether in a custom property
   * value, a utility class, or a base style — html2canvas's internal parser
   * crashes. The only way to prevent that is to pre-convert the actual
   * stylesheet rules before cloning happens.
   */
  const patchStyleSheets = (): (() => void) => {
    const restoreFns: (() => void)[] = []

    // 1. Patch <style> elements by rewriting textContent directly.
    //    This is far more reliable than the CSSStyleSheet API (deleteRule/
    //    insertRule) because Tailwind v4 wraps generated CSS inside @layer
    //    blocks — CSSGroupingRules whose replacement via the CSSOM often
    //    fails silently, leaving oklab()/oklch() intact for html2canvas to
    //    choke on. Direct text replacement handles all nesting levels.
    const styleTags = document.querySelectorAll('style')
    for (const style of styleTags) {
      const original = style.textContent
      if (!original || (!original.includes('oklch') && !original.includes('oklab'))) continue

      const patched = convertOklchInString(original)
      if (patched === original) continue

      style.textContent = patched
      restoreFns.push(() => {
        style.textContent = original
      })
    }

    // 2. For <link> stylesheets we can't touch textContent, so fall back to
    //    the CSSOM rule-replacement approach with recursive descent into
    //    grouping rules (@layer, @media, @supports, etc.).
    const patchRuleList = (
      ruleList: CSSRuleList,
      parentStyleSheetOrRule: CSSStyleSheet | CSSGroupingRule,
    ) => {
      for (let i = ruleList.length - 1; i >= 0; i--) {
        const rule = ruleList[i]

        // Recurse into grouping rules (@layer, @media, @supports)
        if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
          patchRuleList((rule as CSSGroupingRule).cssRules, rule as CSSGroupingRule)
          continue
        }

        const cssText = rule.cssText
        if (!cssText || (!cssText.includes('oklch') && !cssText.includes('oklab'))) continue

        const newCssText = convertOklchInString(cssText)
        if (newCssText === cssText) continue

        try {
          parentStyleSheetOrRule.deleteRule(i)
          parentStyleSheetOrRule.insertRule(newCssText, i)
          const parent = parentStyleSheetOrRule
          const idx = i
          const orig = cssText
          restoreFns.push(() => {
            try {
              parent.deleteRule(idx)
              parent.insertRule(orig, idx)
            } catch {
              // Best-effort restore
            }
          })
        } catch {
          // Rule can't be replaced (e.g. @keyframes with complex inner parts)
        }
      }
    }

    for (const sheet of document.styleSheets) {
      try {
        // Skip sheets backed by <style> tags — already handled above
        if (sheet.ownerNode instanceof HTMLStyleElement) continue
        const rules = sheet.cssRules
        if (!rules) continue
        patchRuleList(rules, sheet)
      } catch {
        // Cross-origin stylesheet — can't access
      }
    }

    // 3. Inject a <style> override for :root CSS custom properties
    //    (belt-and-suspenders with the patching above)
    const cs = getComputedStyle(document.documentElement)
    const varOverrides: string[] = []
    for (const name of CSS_VARS_TO_PATCH) {
      const value = cs.getPropertyValue(name)
      if (value && (value.includes('oklch') || value.includes('oklab'))) {
        varOverrides.push(`  ${name}: ${convertOklchInString(value)} !important;`)
      }
    }
    let varStyle: HTMLStyleElement | null = null
    if (varOverrides.length > 0) {
      varStyle = document.createElement('style')
      varStyle.id = 'fs-oklch-override'
      varStyle.textContent = `:root {\n${varOverrides.join('\n')}\n}`
      document.head.appendChild(varStyle)
    }

    return () => {
      // Restore patched rules/styles in reverse order
      for (let i = restoreFns.length - 1; i >= 0; i--) {
        restoreFns[i]()
      }
      // Remove injected style tag
      if (varStyle) varStyle.remove()
    }
  }

  const handleDownloadCard = async () => {
    setIsDownloading(true)

    const wrapper = document.getElementById('whatsapp-fact-check-card') as HTMLElement | null
    if (!wrapper) {
      toast.error('Card element not found')
      setIsDownloading(false)
      return
    }

    try {
      // html-to-image uses browser native SVG foreignObject rendering.
      // It captures EXACT fonts, Flexbox alignment, crisp text, and shadows with zero layout glitches.
      const dataUrl = await toPng(wrapper, {
        pixelRatio: 2, // Crisp 2x high resolution (1080px wide)
        backgroundColor: '#fffbf5',
        cacheBust: true,
        skipFonts: true,
      })

      const link = document.createElement('a')
      link.download = `factstamp-${claim.id}.png`
      link.href = dataUrl
      link.click()
      toast.success('Fact-check card downloaded!', {
        description: 'You can now share this PNG card back into your WhatsApp group.',
      })
    } catch (err) {
      console.error('[FactStamp] PNG capture error:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error('Download failed', {
        description: `Could not generate PNG: ${message}`,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="container mx-auto px-[clamp(1rem,4vw,3rem)] py-8">
      <Seo title={claim.text.slice(0, 60)} description={`Fact-check verdict for: ${claim.text.slice(0, 120)}`} />
      <Breadcrumbs currentLabel={claim.text.slice(0, 40) + '…'} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start mt-4">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Claim Card */}
        <div className="hairline-card p-6">
          <div className="flex items-center justify-between mb-4">
            <CategoryBadge category={claim.category} />
            <time className="text-xs text-[var(--color-fg-muted)] font-mono tabular-nums">
              {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
            </time>
          </div>

          <p className="text-lg text-[var(--color-fg)] leading-relaxed mb-6">
            {claim.text}
          </p>

          {/* Attached screenshot (uploaded via Firebase Storage) */}
          {claim.imageUrl && (
            <a
              href={claim.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-6 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-soft)] hover:border-[var(--color-brand)] transition-colors"
            >
              <img
                src={claim.imageUrl}
                alt="Screenshot attached with this claim"
                className="w-full max-h-80 object-contain bg-[var(--color-surface-2)]"
                loading="lazy"
              />
            </a>
          )}

          {/* Verdict Stamp */}
          {claim.verdict && (
            <div className="flex items-center justify-center py-8">
              <VerdictStamp verdict={claim.verdict} confidenceScore={claim.confidenceScore} />
            </div>
          )}
        </div>

        {/* Contested State Card — No Consensus accordion */}
        {claim.verdict === 'CONTESTED' && (
          <div
            className="hairline-card p-6 border-2"
            style={{ borderColor: 'var(--color-v-contested-border)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-v-contested-bg)' }}
              >
                <RefreshCw className="w-6 h-6" style={{ color: 'var(--color-v-contested)' }} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-v-contested)' }}>
                  No Consensus Reached
                </h2>
                <p className="text-sm text-[var(--color-fg-2)]">
                  This claim is marked <strong>CONTESTED</strong>
                </p>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-sm text-[var(--color-fg-2)] leading-relaxed mb-4">
              This claim did not receive the minimum 3 independent verifications within the 7-day consensus window.
              {claim.verificationCount > 0
                ? ` Only ${claim.verificationCount} of 3 required verifications were submitted.`
                : ' No verifications were submitted before the deadline.'}
            </p>

            {/* Deadline info */}
            <p className="text-xs text-[var(--color-fg-muted)] mb-4">
              Consensus deadline was {claim.verifiedAt
                ? formatDistanceToNow(new Date(claim.verifiedAt), { addSuffix: true })
                : formatDistanceToNow(new Date(claim.consensusDeadline), { addSuffix: true })}
              &nbsp;&middot; Confidence score: {claim.confidenceScore ?? '—'}%
            </p>

            {/* Native <details> accordion for submitted verifications */}
            {claim.verifications.length > 0 && (
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none py-2.5 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-2)]/80 transition-colors text-sm font-medium text-[var(--color-fg)]">
                  <span>View {claim.verificationCount} submitted verification{claim.verificationCount !== 1 ? 's' : ''}</span>
                  <ChevronDown className="w-4 h-4 text-[var(--color-fg-muted)] group-open:rotate-180 transition-transform duration-200" aria-hidden="true" />
                </summary>
                <div className="mt-4 space-y-4">
                  {claim.verifications.map((v) => (
                    <div key={v.id} className="flex gap-3 pb-4 border-b border-[var(--color-border-soft)] last:border-b-0 last:pb-0">
                      <Avatar initials={v.verifierName[0]} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs text-[var(--color-fg)]">{v.verifierName}</span>
                          <VerdictPill verdict={v.verdict} size="sm" />
                        </div>
                        <p className="text-xs text-[var(--color-fg-2)] mb-1.5 leading-relaxed line-clamp-2">{v.explanation}</p>
                        <div className="flex items-center gap-1.5">
                          <SourceQualityDot quality={v.sourceQuality} />
                          <a
                            href={v.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[var(--color-accent)] hover:underline truncate"
                          >
                            {v.sourceUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Verifications List */}
        {claim.status === 'verified' && claim.verdict !== 'CONTESTED' && claim.verifications.length > 0 && (
          <div className="hairline-card p-6">
            <h2 className="text-xl font-bold mb-4">Community verifications</h2>
            <div className="space-y-6">
              {claim.verifications.map((v) => (
                <div key={v.id} className="flex gap-4 pb-6 border-b border-[var(--color-border-soft)] last:border-b-0 last:pb-0">
                  <Avatar
                    initials={v.verifierName[0]}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-[var(--color-fg)]">{v.verifierName}</span>
                      <VerdictPill verdict={v.verdict} size="sm" />
                    </div>
                    <p className="text-sm text-[var(--color-fg-2)] mb-2">{v.explanation}</p>
                    <div className="flex items-center gap-2">
                      <SourceQualityDot quality={v.sourceQuality} />
                      <a
                        href={v.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-accent)] hover:underline truncate"
                      >
                        {v.sourceUrl}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for pending claims with no verifications */}
        {claim.status === 'pending' && claim.verifications.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="No verifications yet"
            description="This claim hasn't been verified yet. Be the first to submit a verdict."
            action={user ? {
              label: 'Verify this claim',
              onClick: () => navigate(`/verify/${claim.id}`),
            } : undefined}
          />
        )}

        {/* Partial verifications for pending claims with 1-2 verifiers */}
        {claim.status === 'pending' && claim.verifications.length > 0 && (
          <div className="hairline-card p-6">
            <h2 className="text-xl font-bold mb-4">
              Community verifications
              <span className="text-sm font-normal text-[var(--color-fg-muted)] ml-2">
                ({claim.verificationCount}/3 — pending consensus)
              </span>
            </h2>
            <div className="space-y-6">
              {claim.verifications.map((v) => (
                <div key={v.id} className="flex gap-4 pb-6 border-b border-[var(--color-border-soft)] last:border-b-0 last:pb-0">
                  <Avatar
                    initials={v.verifierName[0]}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-[var(--color-fg)]">{v.verifierName}</span>
                      <VerdictPill verdict={v.verdict} size="sm" />
                    </div>
                    <p className="text-sm text-[var(--color-fg-2)] mb-2">{v.explanation}</p>
                    <div className="flex items-center gap-2">
                      <SourceQualityDot quality={v.sourceQuality} />
                      <a
                        href={v.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-accent)] hover:underline truncate"
                      >
                        {v.sourceUrl}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:sticky lg:top-20 space-y-6">
        {claim.status === 'pending' && (
          <div className="hairline-card p-6">
            <h3 className="font-semibold mb-4 text-sm">Verification progress</h3>

            {/* 3 Avatar circles showing filled / next / empty slots */}
            <div
              className="flex items-center justify-center gap-6 mb-4"
              role="img"
              aria-label={`${claim.verificationCount} of 3 verifiers`}
            >
              {Array.from({ length: 3 }).map((_, i) => {
                const v = claim.verifications[i]
                const isFilled = i < claim.verificationCount
                const isNext = i === claim.verificationCount

                if (isFilled && v) {
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <Avatar initials={v.verifierName[0]} size="md" online />
                      <span className="text-[10px] text-[var(--color-fg)] font-medium truncate max-w-[60px] text-center leading-tight">
                        {v.verifierName.split(' ')[0]}
                      </span>
                    </div>
                  )
                }

                if (isNext) {
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center animate-pulse"
                        style={{
                          borderColor: 'var(--color-brand)',
                          backgroundColor: 'var(--color-accent-subtle)',
                        }}
                      >
                        <Plus className="w-4 h-4" style={{ color: 'var(--color-brand)' }} aria-hidden="true" />
                      </div>
                      <span className="text-[10px] text-[var(--color-brand)] font-medium">Next</span>
                    </div>
                  )
                }

                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-2)] flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-strong)]" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] text-[var(--color-fg-muted)]">Open</span>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-center text-[var(--color-fg-2)] mb-4">
              {claim.verificationCount} of 3 verifications submitted
            </p>

            <Button
              intent="primary"
              className="w-full"
              onClick={() => navigate(`/verify/${claim.id}`)}
            >
              {claim.verificationCount === 0 ? 'Verify this claim' : 'Add your verdict'}
            </Button>
          </div>
        )}

        {claim.status === 'verified' && claim.verdict === 'CONTESTED' && (
          <div className="hairline-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="w-5 h-5" style={{ color: 'var(--color-v-contested)' }} aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-v-contested)' }}>Claim Status: CONTESTED</h3>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                  {claim.verificationCount} of 3 verifications submitted
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-fg-2)] leading-relaxed mb-3">
              This claim did not reach consensus within the 7-day window. The verdict is marked contested, indicating insufficient verification data.
            </p>
            <p className="text-xs text-[var(--color-fg-muted)] mb-4">
              Confidence score: {claim.confidenceScore ?? '—'}% &middot; {claim.verificationCount} verification{claim.verificationCount !== 1 ? 's' : ''}
            </p>
            <Button
              intent="secondary"
              size="sm"
              className="w-full"
              onClick={() => navigate('/verify')}
            >
              View similar claims
            </Button>
          </div>
        )}

        {claim.status === 'verified' && claim.verdict !== 'CONTESTED' && (
          <div className="hairline-card p-5 border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] rounded-[var(--radius-xl)] space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center text-[#25D366] flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--color-fg)]">WhatsApp Fact Card</h3>
                <p className="text-[11px] text-[var(--color-fg-muted)]">Official 1:1 image preview</p>
              </div>
            </div>

            {/* Live PNG Card Preview Frame */}
            <div className="rounded-xl overflow-hidden border border-[var(--color-border-soft)] shadow-inner bg-[var(--color-bg)]">
              <FactCheckCard claim={claim} id="whatsapp-fact-check-card" />
            </div>

            <Button
              intent="primary"
              size="md"
              className="w-full font-bold shadow-md"
              onClick={handleDownloadCard}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4 me-1" />
              {isDownloading ? 'Generating PNG...' : 'Download WhatsApp Card (PNG)'}
            </Button>
          </div>
        )}

            {/* Confidence Breakdown Card */}
            {claim.agreementRatio !== undefined && (
              <div className="hairline-card p-5 space-y-4">
                {/* Header */}
                <div className="border-b border-[var(--color-border-soft)] pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-mono font-bold text-[var(--color-fg-muted)] uppercase tracking-wider">
                      Confidence Breakdown
                    </h3>
                    {claim.confidenceScore !== undefined && (
                      <span className="font-mono text-sm font-black text-[var(--color-brand)] tabular-nums">
                        {claim.confidenceScore}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-[var(--color-fg)]">
                      <span className={`w-2 h-2 rounded-full ${(claim.confidenceScore ?? 0) >= 80 ? 'bg-emerald-500' : (claim.confidenceScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      {(claim.confidenceScore ?? 0) >= 80 ? 'High Confidence' : (claim.confidenceScore ?? 0) >= 50 ? 'Moderate' : 'Low Confidence'}
                    </span>
                    <span className="text-[var(--color-fg-muted)]">•</span>
                    <span className="text-[11px] font-mono text-[var(--color-fg-muted)]">3 Signals</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3.5">
                  {[
                    { label: 'Verifier consensus', value: claim.agreementRatio, weight: '40%' },
                    { label: 'Contributor reputation', value: claim.avgVerifierReputation ?? 0, weight: '30%' },
                    { label: 'Source domain authority', value: claim.sourceQualityScore ?? 0, weight: '30%' },
                  ].map((item) => {
                    const val = Math.round(item.value)
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-fg)] font-medium truncate pr-2">{item.label}</span>
                          <div className="flex items-center gap-1.5 font-mono text-xs flex-shrink-0">
                            <span className="font-bold text-[var(--color-fg)] tabular-nums">{val}%</span>
                            <span className="text-[10px] text-[var(--color-fg-muted)]">({item.weight})</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Explanation Footnote */}
                <p className="text-[11px] text-[var(--color-fg-muted)] leading-relaxed pt-2.5 border-t border-[var(--color-border-soft)]">
                  Calculated from weighted verifier agreement (40%), reviewer trust score (30%), and source domain authority (30%).
                </p>
              </div>
            )}
      </aside>
      </div>
    </div>
  )
}
