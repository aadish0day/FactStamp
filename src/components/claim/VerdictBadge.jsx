import clsx from 'clsx';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Clock, RefreshCw } from 'lucide-react';
import './VerdictBadge.css';

const VERDICT_MAP = {
  TRUE:         { Icon: CheckCircle2,  label: 'TRUE',         cls: 'verdict-TRUE' },
  FALSE:        { Icon: XCircle,      label: 'FALSE',        cls: 'verdict-FALSE' },
  MISLEADING:   { Icon: AlertTriangle, label: 'MISLEADING',   cls: 'verdict-MISLEADING' },
  UNVERIFIABLE: { Icon: HelpCircle,   label: 'UNVERIFIABLE', cls: 'verdict-UNVERIFIABLE' },
  PENDING:      { Icon: Clock,        label: 'PENDING',      cls: 'verdict-PENDING' },
  CONTESTED:    { Icon: RefreshCw,    label: 'CONTESTED',    cls: 'verdict-CONTESTED' },
};

export default function VerdictBadge({ verdict = 'PENDING', size = 'md' }) {
  const v = VERDICT_MAP[verdict] || VERDICT_MAP.PENDING;
  const Icon = v.Icon;
  const isPulse = verdict === 'PENDING';
  const iconSize = size === 'sm' ? 12 : 14;
  return (
    <span className={clsx('verdict-badge', `verdict-badge-${size}`, v.cls)}>
      <span className={clsx('verdict-badge-icon', isPulse && 'verdict-badge-icon--pulse')}>
        <Icon size={iconSize} />
      </span>
      {v.label}
    </span>
  );
}
