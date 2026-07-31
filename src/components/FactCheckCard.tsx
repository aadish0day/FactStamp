import { ShieldAlert, Download, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Scale } from 'lucide-react'
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

export function FactCheckCard({ claim, id = 'fact-check-card', onDownload }: FactCheckCardProps) {
  if (!claim.verdict) return null

  const meta = VERDICT_META[claim.verdict]
  const Icon = VERDICT_ICONS[claim.verdict]
  const topVerification = claim.verifications?.[0]

  return (
    <div className="space-y-4">
      {/*
        Export card — 1:1 square with all colors hardcoded as hex so
        html2canvas never encounters oklch/oklab.
        We use inline styles for every visual property to guarantee
        pixel-perfect rendering in the PNG.
      */}
      <div
        id={id}
        style={{
          width: '100%',
          maxWidth: '540px',
          margin: '0 auto',
          padding: '32px',
          borderRadius: '20px',
          backgroundColor: CARD_PALETTE.bg,
          border: `2px solid ${meta.hexBorder}`,
          boxShadow: `0 8px 32px -4px ${meta.thudColor}, 0 0 0 1px rgba(0,0,0,0.03)`,
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '12px',
          position: 'relative' as const,
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
          <ShieldAlert style={{ width: '240px', height: '240px', color: CARD_PALETTE.fg }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${CARD_PALETTE.border}`,
          paddingBottom: '14px',
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

        {/* ── Claim Text ── */}
        <div>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: CARD_PALETTE.fgMuted,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            marginBottom: '6px',
          }}>
            CLAIM FORWARDED:
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            color: CARD_PALETTE.fg,
            lineHeight: 1.55,
            fontStyle: 'italic',
            backgroundColor: CARD_PALETTE.surface,
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1px solid ${CARD_PALETTE.border}`,
          }}>
            &ldquo;{claim.text}&rdquo;
          </div>
        </div>

        {/* ── Central Verdict Stamp ── */}
        <div style={{
          padding: '20px 16px',
          borderRadius: '14px',
          border: `2.5px solid ${meta.hexBorder}`,
          backgroundColor: meta.hexBg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <Icon style={{ width: '40px', height: '40px', color: meta.hexColor }} />
            <span style={{
              fontSize: '32px',
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
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 500,
                color: CARD_PALETTE.fgSecondary,
              }}>
                Confidence:{' '}
              </span>
              <span style={{
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontVariantNumeric: 'tabular-nums',
                color: meta.hexColor,
              }}>
                {claim.confidenceScore}%
              </span>
            </div>
          )}
        </div>

        {/* ── Verification Explanation ── */}
        {topVerification && (
          <div style={{
            fontSize: '11px',
            lineHeight: 1.5,
            color: CARD_PALETTE.fgSecondary,
            backgroundColor: CARD_PALETTE.surface,
            padding: '10px 12px',
            borderRadius: '8px',
            border: `1px solid ${CARD_PALETTE.border}`,
          }}>
            <span style={{ fontWeight: 600, color: CARD_PALETTE.fg }}>Why: </span>
            {topVerification.explanation}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          paddingTop: '12px',
          borderTop: `1px solid ${CARD_PALETTE.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: CARD_PALETTE.fgMuted,

        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            maxWidth: '220px',
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
