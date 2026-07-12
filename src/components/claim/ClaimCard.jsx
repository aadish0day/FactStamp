import clsx from 'clsx';
import { Eye, AlertTriangle } from 'lucide-react';
import CategoryTag from './CategoryTag.jsx';
import VerdictBadge from './VerdictBadge.jsx';
import ConfidenceBar from './ConfidenceBar.jsx';
import { timeAgo } from '../../logic/formatDate.js';
import './ClaimCard.css';

export default function ClaimCard({ claim, onClick, compact = false }) {
  const verdict = claim.verdict || 'PENDING';
  const score = claim.confidenceScore ?? 0;

  const handleClick = () => {
    if (onClick) onClick(claim);
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(claim);
    }
  };

  return (
    <div
      className={clsx(
        'claim-card',
        compact && 'claim-card-compact',
        onClick && 'claim-card-clickable'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {claim.isUrgent && (
        <span className="claim-card-urgent">
          <AlertTriangle size={12} /> URGENT
        </span>
      )}

      <div className="claim-card-top">
        <CategoryTag category={claim.category} />
        <span className="claim-card-spacer" />
        <span className="claim-card-time mono">{timeAgo(claim.createdAt)}</span>
      </div>

      <p className="claim-card-text">{claim.text}</p>

      <div className="claim-card-bottom">
        <VerdictBadge verdict={verdict} size="sm" />
        <span className="claim-card-spacer" />
        <div className="claim-card-confidence">
          <ConfidenceBar score={score} />
        </div>
      </div>

      <div className="claim-card-footer">
        <span className="claim-card-views mono">
          <Eye size={12} /> {claim.viewCount}
        </span>
      </div>
    </div>
  );
}
