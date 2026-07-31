import { ShieldAlert, Download, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Scale, Users, Globe } from 'lucide-react'
import { VERDICT_META, type Claim } from '@/lib/types'

interface FactCheckCardProps {
  claim: Claim
  id?: string
  onDownload?: () => void
}

const VERDICT_ICONS = {
  TRUE: CheckCircle2,
  FALSE: XCircle,
  MISLEADING: AlertTriangle,
  UNVERIFIABLE: HelpCircle,
  CONTESTED: Scale,
}

/**
 * Hardcoded palette for export-safe rendering.
 * html2canvas cannot parse oklch()/oklab() or CSS custom properties that
 * resolve to them. Every color here is a plain hex/rgb string.
 */
const CARD_PALETTE = {
  bg: '#ffffff',
  surface: '#f8f5f1',
  border: '#e8e2da',
  fg: '#1c1917',
  fgSecondary: '#57534e',
  fgMuted: '#a8a29e',
  brand: '#c2410c',
  brandBg: '#fff7ed',
}

const SOURCE_QUALITY_COLORS: Record<string, string> = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#dc2626',
}

/** Truncate claim text to 100 chars for the share card. */
function truncateClaim(text: string, max = 100): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

/** Collect every unique source domain cited across verifications. */
function collectSourceDomains(claim: Claim): string[] {
  const domains = new Set<string>()
  for (const v of claim.verifications) {
    try {
      const host = new URL(v.sourceUrl).hostname.replace(/^www\./, '')
      domains.add(host)
    } catch {
      // Ignore malformed URLs
    }
  }
  return [...domains].slice(0, 3)
}

export function FactCheckCard({ claim, id = 'fact-check-card', onDownload }: FactCheckCardProps) {
  if (!claim.verdict) return null

  const meta = VERDICT_META[claim.verdict]
  const Icon = VERDICT_ICONS[claim.verdict]
  const topVerification = claim.verifications?.[0]
  const sourceDomains = collectSourceDomains(claim)

  // One-line explanation: collapse whitespace and truncate to a single line
  const oneLineExplanation = topVerification
    ? topVerification.explanation.replace(/\s+/g, ' ').trim()
    : ''

  return (
    <div className="space-y-4">
      {/* Export card — exactly 540px tall in the DOM and exported at scale 2,
          producing a true 1080×1080px PNG for WhatsApp compatibility.
          All colors are hardcoded hex so html2canvas never sees oklch/oklab. */}
      <div
        id={id}
        style={{
          width: '100%',
          maxWidth: '540px',
          aspectRatio: '1 / 1',
          margin: '0 auto',
          padding: '28px',
          borderRadius: '20px',
          backgroundColor: CARD_PALETTE.bg,
          border: `2px solid ${meta.hexBorder}`,
          boxShadow: `0 8px 32px -4px ${meta.thudColor}, 0 0 0 1px rgba(0,0,0,0.03)`,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '10px',
          position: 'relative' as const,
          overflow: 'hidden',
          userSelect: 'none' as const,
          fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Subtle watermark */}
        <div style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          opacity: 0.03,
          pointerEvents: 'none',
        }}>
          <ShieldAlert style={{ width: '220px', height: '220px', color: CARD_PALETTE.fg }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${CARD_PALETTE.border}`,
          paddingBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${CARD_PALETTE.brand}, #ea580c)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldAlert style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <div>
              <div style={{
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '-0.01em',
                color: CARD_PALETTE.fg,
                lineHeight: 1.2,
              }}>
                FactStamp
              </div>
              <div style={{
                fontSize: '9px',
                color: CARD_PALETTE.fgMuted,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '1px',
              }}>
                Fact-Check Card
              </div>
            </div>
          </div>

          {/* Category pill */}
          <div style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: meta.hexBg,
            color: meta.hexColor,
            border: `1px solid ${meta.hexBorder}`,
          }}>
            {claim.category}
          </div>
        </div>

        {/* ── Claim Text (truncated to 100 chars) ── */}
        <div>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: CARD_PALETTE.fgMuted,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            marginBottom: '5px',
          }}>
            CLAIM FORWARDED:
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 500,
            color: CARD_PALETTE.fg,
            lineHeight: 1.5,
            fontStyle: 'italic',
            backgroundColor: CARD_PALETTE.surface,
            padding: '10px 12px',
            borderRadius: '10px',
            border: `1px solid ${CARD_PALETTE.border}`,
            minHeight: '54px',
            display: 'flex',
            alignItems: 'center',
          }}>
            &ldquo;{truncateClaim(claim.text)}&rdquo;
          </div>
        </div>

        {/* ── Central Verdict Stamp ── */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '14px',
          border: `2.5px solid ${meta.hexBorder}`,
          backgroundColor: meta.hexBg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon style={{ width: '36px', height: '36px', color: meta.hexColor }} />
            <span style={{
              fontSize: '30px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: meta.hexColor,
              lineHeight: 1,
            }}>
              {meta.label}
            </span>
          </div>
          {claim.confidenceScore !== undefined && (
            <div style={{ textAlign: 'center', marginTop: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: CARD_PALETTE.fgSecondary }}>
                Confidence:{' '}
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 700,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontVariantNumeric: 'tabular-nums',
                color: meta.hexColor,
              }}>
                {claim.confidenceScore}%
              </span>
            </div>
          )}

          {/* Verifier count */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10px',
            fontWeight: 600,
            color: CARD_PALETTE.fgSecondary,
            marginTop: '2px',
          }}>
            <Users style={{ width: '11px', height: '11px', color: CARD_PALETTE.brand }} />
            {claim.verificationCount} community verifier{claim.verificationCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── One-line Explanation ── */}
        {oneLineExplanation && (
          <div style={{
            fontSize: '11px',
            lineHeight: 1.4,
            color: CARD_PALETTE.fgSecondary,
            backgroundColor: CARD_PALETTE.surface,
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${CARD_PALETTE.border}`,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            <span style={{ fontWeight: 600, color: CARD_PALETTE.fg }}>Why: </span>
            {oneLineExplanation}
          </div>
        )}

        {/* ── Source Domains ── */}
        {sourceDomains.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '9px',
            color: CARD_PALETTE.fgMuted,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <Globe style={{ width: '10px', height: '10px', flexShrink: 0, color: CARD_PALETTE.brand }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sourceDomains.join(' · ')}
            </span>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '10px',
          borderTop: `1px solid ${CARD_PALETTE.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: CARD_PALETTE.fgMuted,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            maxWidth: '60%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {topVerification && (
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: SOURCE_QUALITY_COLORS[topVerification.sourceQuality] || '#a8a29e',
                flexShrink: 0,
                display: 'inline-block',
              }} />
            )}
            <span style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {topVerification
                ? (() => { try { return new URL(topVerification.sourceUrl).hostname } catch { return 'factstamp.vercel.app' } })()
                : 'factstamp.vercel.app'
              }
            </span>
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: '9px',
            fontWeight: 600,
            color: CARD_PALETTE.brand,
            letterSpacing: '0.02em',
          }}>
            factstamp.vercel.app
          </div>
        </div>
      </div>

      {onDownload && (
        <button
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[var(--radius-md)] font-semibold text-sm bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)] shadow-[var(--shadow-sm)] transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download WhatsApp Card (PNG)
        </button>
      )}
    </div>
  )
}
