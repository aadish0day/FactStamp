import clsx from 'clsx';
import './ui.css';

function bandColor(score) {
  if (score < 40) return 'var(--v-false)';
  if (score < 70) return 'var(--v-misleading)';
  return 'var(--v-true)';
}

export default function ProgressBar({ value, max = 100, color, className }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const c = color || 'var(--accent)';
  return (
    <div className={clsx('progress-bar', className)}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: c }} />
    </div>
  );
}
