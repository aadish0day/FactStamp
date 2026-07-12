import clsx from 'clsx';
import './ConfidenceBar.css';

function bandColor(score) {
  if (score >= 70) return 'var(--v-true)';
  if (score >= 40) return 'var(--v-misleading)';
  return 'var(--v-false)';
}

export default function ConfidenceBar({ score = 0, label = false }) {
  const color = bandColor(score);
  return (
    <div className="confidence-bar">
      {label && (
        <div className="confidence-bar-row">
          <span className="confidence-bar-label">Confidence Score</span>
          <span className="confidence-bar-value mono" style={{ color }}>{score}%</span>
        </div>
      )}
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ '--bar-width': `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
