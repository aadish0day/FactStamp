import clsx from 'clsx';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import './VerdictStamp.css';

const STAMP_MAP = {
  TRUE:         { Icon: CheckCircle2,   cls: 'stamp-TRUE' },
  FALSE:        { Icon: XCircle,        cls: 'stamp-FALSE' },
  MISLEADING:   { Icon: AlertTriangle,  cls: 'stamp-MISLEADING' },
  UNVERIFIABLE: { Icon: HelpCircle,     cls: 'stamp-UNVERIFIABLE' },
};

function hashAngle(id) {
  let h = 0;
  for (let i = 0; i < (id || '').length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const norm = Math.abs(h) % 4;
  return -(6 - norm);
}

export default function VerdictStamp({ verdict, claimId, size = 140 }) {
  const s = STAMP_MAP[verdict] || STAMP_MAP.UNVERIFIABLE;
  const Icon = s.Icon;
  const angle = hashAngle(claimId);
  const dots = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div
      className={clsx('stamp', s.cls)}
      style={{ '--stamp-rot': `${angle}deg`, width: size, height: size }}
    >
      <div className="stamp-outer-ring" />
      <div className="stamp-inner-ring" />
      <div className="stamp-ink-bleed" />
      {dots.map((i) => (
        <span
          key={i}
          className="stamp-serration"
          style={{ transform: `rotate(${(360 / 16) * i}deg) translateY(calc(${size / 2}px - 3px))` }}
        />
      ))}
      <div className="stamp-content">
        <span className="stamp-icon"><Icon size={28} /></span>
        <span className="stamp-text">{verdict}</span>
      </div>
    </div>
  );
}
