import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

const VERDICT_ICON = {
  TRUE: CheckCircle2,
  FALSE: XCircle,
  MISLEADING: AlertTriangle,
  UNVERIFIABLE: HelpCircle,
};

const VERDICT_STYLE = {
  TRUE:         { color: '#22C55E', border: 'rgba(34,197,94,0.3)',   bg: 'rgba(34,197,94,0.12)' },
  FALSE:        { color: '#EF4444', border: 'rgba(239,68,68,0.3)',  bg: 'rgba(239,68,68,0.12)' },
  MISLEADING:   { color: '#F59E0B', border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.12)' },
  UNVERIFIABLE: { color: '#6B7280', border: 'rgba(107,114,128,0.3)',bg: 'rgba(107,114,128,0.12)' },
};

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
}

export default function FactCheckCard({ claim, verdicts = [] }) {
  const verdict = claim.verdict || verdicts[0]?.verdict || 'UNVERIFIABLE';
  const vs = VERDICT_STYLE[verdict] || VERDICT_STYLE.UNVERIFIABLE;
  const VerdictIcon = VERDICT_ICON[verdict] || HelpCircle;
  const score = claim.confidenceScore ?? 0;
  const explanation = verdicts[0]?.explanation || '';
  const sources = verdicts.map((v) => v.sourceUrl).filter(Boolean);

  return (
    <div
      id={`fcc-${claim.id}`}
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: 540,
        height: 540,
        overflow: 'hidden',
        background: '#080810',
        padding: 36,
        boxSizing: 'border-box',
        fontFamily: 'Inter, sans-serif',
        color: '#EEEEF8',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <ShieldAlert size={24} color="#6C63FF" style={{ marginRight: 8, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: '#6C63FF',
            letterSpacing: '0.18em',
          }}
        >
          FACTSTAMP
        </span>
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 10,
            color: '#55556A',
            letterSpacing: '0.12em',
          }}
        >
          FACT CHECK
        </span>
      </div>
      <div style={{ height: 1, background: '#1E1E36' }} />

      {/* Claim */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontSize: 10,
            color: '#55556A',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          CLAIM
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#EEEEF8',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {claim.text}
        </div>
      </div>

      {/* Verdict */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            borderRadius: 12,
            border: `1px solid ${vs.border}`,
            background: vs.bg,
            padding: '12px 24px',
            transform: 'rotate(-4deg)',
          }}
        >
          <VerdictIcon size={24} color={vs.color} />
          <span
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              fontSize: 22,
              color: vs.color,
              letterSpacing: '0.08em',
            }}
          >
            {verdict}
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#55556A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            CONFIDENCE
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
              fontSize: 20,
              color: '#FFFFFF',
            }}
          >
            {score}%
          </span>
        </div>
        <div style={{ width: '100%', height: 4, background: '#1E1E36', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: vs.color, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 11, color: '#55556A', marginTop: 6 }}>
          Verified by {claim.verificationCount || 0} community members
        </div>
      </div>

      {/* Why */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: '#55556A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          WHY THIS IS {verdict}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#9898B8',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {explanation}
        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: '#55556A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            SOURCES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sources.map((url, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  color: '#6C63FF',
                  background: 'rgba(108,99,255,0.10)',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                {domainOf(url)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 28, left: 36, right: 36 }}>
        <div style={{ height: 1, background: '#1E1E36', marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#55556A' }}>
            whisper-stop.vercel.app
          </span>
          <span style={{ fontSize: 10, color: '#55556A' }}>Verify before you forward</span>
        </div>
      </div>
    </div>
  );
}
