import Button from './Button.jsx';
import './ui.css';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} className="empty-icon" />}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {actionLabel && (
        <Button variant="primary" onClick={onAction} className="empty-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
