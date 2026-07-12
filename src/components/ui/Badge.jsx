import clsx from 'clsx';
import './ui.css';

export default function Badge({ tone = 'neutral', size = 'md', icon: Icon, children, className }) {
  return (
    <span className={clsx('badge', `badge-${tone}`, `badge-${size}`, className)}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
    </span>
  );
}
