import clsx from 'clsx';
import './ui.css';

export default function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={clsx('tabs', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={clsx('tab', active === t.key && 'tab-active')}
          onClick={() => onChange(t.key)}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}
