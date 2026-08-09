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
 * html2canvas cannot parse oklch()/oklab() or CSS custom properties.
 * Every color here is a plain hex string.
 */
const P = {
  bg: '#fffbf5',
  surface: '#f6f1ea',
  border: '#e6ded4',
  borderDark: '#d4c8b8',
  fg: '#1c1917',
  fgSec: '#57534e',
  fgMuted: '#948e85',
  brand: '#c2410c',
  brandLight: '#ea580c',
  white: '#ffffff',
}

/** Smart text truncation at word boundaries so words are never cut in half. */
function truncateText(text: string, max = 150): string {
  if (!text) return ''
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= max) return trimmed
  const cut = trimmed.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

/** Collect unique source domains from verifications. */
function collectDomains(claim: Claim): string[] {
  const d = new Set<string>()
  for (const v of claim.verifications) {
    try {
      d.add(new URL(v.sourceUrl).hostname.replace(/^www\./, ''))
    } catch {
      /* skip */
    }
  }
  return [...d].slice(0, 3)
}

/**
 * FactCheckCard – High-end editorial fact-check share card.
 * Designed for pixel-perfect PNG export at 540px width (1080px @ scale 2).
 */
export function FactCheckCard({ claim, id = 'fact-check-card', onDownload }: FactCheckCardProps) {
  if (!claim.verdict) return null

  const meta = VERDICT_META[claim.verdict]
  const VIcon = VERDICT_ICONS[claim.verdict]
  const topV = claim.verifications?.[0]
  const domains = collectDomains(claim)

  const explanation = topV
    ? topV.explanation.replace(/\s+/g, ' ').trim()
    : ''

  const dateStr = claim.createdAt
    ? new Date(claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const fontSans = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const fontMono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

  return (
    <div className="space-y-4">
      {/* Outer Card Shell */}
      <div
        id={id}
        style={{
          width: '100%',
          maxWidth: '540px',
          margin: '0 auto',
          padding: '0',
          borderRadius: '20px',
          backgroundColor: P.bg,
          border: `2px solid ${meta.hexBorder}`,
          boxShadow: `0 12px 32px -8px ${meta.thudColor}`,
          position: 'relative' as const,
          userSelect: 'none' as const,
          fontFamily: fontSans,
          boxSizing: 'border-box' as const,
          overflow: 'visible' as const, // NO overflow hidden to prevent clipping bottom text
        }}
      >
        {/* ─── Top Gradient Accent Bar ─── */}
        <div style={{
          height: '6px',
          borderRadius: '18px 18px 0 0',
          background: `linear-gradient(90deg, ${meta.hexColor}, ${P.brand}, ${meta.hexColor})`,
        }} />

        {/* ─── Card Inner Padding Container ─── */}
        <div style={{ padding: '20px 20px 28px 20px', boxSizing: 'border-box' }}>

          {/* ── HEADER ROW ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: `linear-gradient(145deg, ${P.brand}, ${P.brandLight})`,
                boxShadow: '0 4px 14px rgba(194,65,12,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShieldAlert style={{ width: '22px', height: '22px', color: P.white }} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.03em', color: P.fg, lineHeight: 1.1 }}>
                  FactStamp
                </div>
                <div style={{ fontSize: '9px', color: P.fgMuted, fontFamily: fontMono, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px', fontWeight: 700 }}>
                  Community Fact-Check
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '4px 12px', borderRadius: '8px',
                backgroundColor: meta.hexBg, color: meta.hexColor, border: `1.5px solid ${meta.hexBorder}`,
              }}>
                {claim.category}
              </div>
              {dateStr && (
                <div style={{ fontSize: '9px', fontFamily: fontMono, color: P.fgMuted, fontWeight: 600 }}>
                  {dateStr}
                </div>
              )}
            </div>
          </div>

          {/* ── Divider Line ── */}
          <div style={{ height: '1px', backgroundColor: P.border, marginBottom: '16px' }} />

          {/* ── FORWARDED CLAIM QUOTE ── */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
              color: P.fgMuted, fontFamily: fontMono, marginBottom: '8px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ width: '16px', height: '2.5px', backgroundColor: P.brand, display: 'inline-block', borderRadius: '2px' }} />
              Forwarded WhatsApp Claim
            </div>
            <div style={{
              fontSize: '13.5px', fontWeight: 500, color: P.fg, lineHeight: 1.55, fontStyle: 'italic',
              backgroundColor: P.surface, padding: '14px 16px', borderRadius: '14px',
              border: `1px solid ${P.border}`, borderLeft: `4px solid ${P.brand}`,
              boxSizing: 'border-box',
            }}>
              &ldquo;{truncateText(claim.text, 145)}&rdquo;
            </div>
          </div>

          {/* ── VERDICT SEAL ── */}
          <div style={{
            padding: '18px 20px 16px',
            borderRadius: '18px',
            border: `2px solid ${meta.hexBorder}`,
            background: `linear-gradient(145deg, ${meta.hexBg}, ${P.white})`,
            boxShadow: `0 6px 20px ${meta.thudColor}`,
            textAlign: 'center',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}>
            {/* Verdict Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <VIcon style={{ width: '40px', height: '40px', color: meta.hexColor, flexShrink: 0 }} />
              <span style={{
                fontSize: '34px', fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '-0.02em', color: meta.hexColor, lineHeight: 1.1,
              }}>
                {meta.label}
              </span>
            </div>

            {/* Stats Row with top border */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap' as const,
              gap: '12px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: `1px solid ${meta.hexBorder}`,
            }}>
              {claim.confidenceScore !== undefined && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: P.fgSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Confidence
                    </span>
                    <span style={{ fontSize: '17px', fontWeight: 900, fontFamily: fontMono, color: meta.hexColor }}>
                      {claim.confidenceScore}%
                    </span>
                  </div>
                  <div style={{ width: '1px', height: '16px', backgroundColor: meta.hexBorder }} />
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: P.fgSec, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Users style={{ width: '14px', height: '14px', color: P.brand }} />
                {claim.verificationCount} verifiers
              </div>
            </div>
          </div>

          {/* ── RATIONALE (WHY BOX) ── */}
          {explanation && (
            <div style={{
              fontSize: '11.5px', lineHeight: 1.5, color: P.fgSec,
              backgroundColor: P.surface, padding: '12px 16px', borderRadius: '14px',
              border: `1px solid ${P.border}`, borderLeft: `4px solid ${meta.hexColor}`,
              marginBottom: '18px', boxSizing: 'border-box',
            }}>
              <span style={{ fontWeight: 800, color: P.fg, textTransform: 'uppercase', fontSize: '9.5px', letterSpacing: '0.08em' }}>
                Consensus Rationale:{' '}
              </span>
              {truncateText(explanation, 140)}
            </div>
          )}

          {/* ── FOOTER ROW ── */}
          <div style={{
            paddingTop: '14px',
            paddingBottom: '6px',
            borderTop: `1px solid ${P.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              maxWidth: '58%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}>
              <Globe style={{ width: '14px', height: '14px', flexShrink: 0, color: P.brand }} />
              <span style={{ fontFamily: fontMono, fontSize: '10px', fontWeight: 600, color: P.fgSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                {domains.length > 0 ? domains.join(' · ') : 'factstamp.vercel.app'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.4 }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '5px',
                background: `linear-gradient(135deg, ${P.brand}, ${P.brandLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ShieldAlert style={{ width: '11px', height: '11px', color: P.white }} />
              </div>
              <span style={{ fontFamily: fontMono, fontSize: '11px', fontWeight: 800, color: P.brand, letterSpacing: '0.02em', lineHeight: 1.4 }}>
                factstamp.vercel.app
              </span>
            </div>
          </div>

        </div>
      </div>

      {onDownload && (
        <button
          onClick={onDownload}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-[var(--radius-lg)] font-bold text-sm bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:bg-[var(--color-brand-hover)] active:scale-[0.98] shadow-[var(--shadow-md)] transition-all duration-200 ease-out cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download WhatsApp Card (PNG)
        </button>
      )}
    </div>
  )
}
