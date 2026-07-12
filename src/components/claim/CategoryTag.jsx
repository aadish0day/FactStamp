import clsx from 'clsx';
import { HeartPulse, Landmark, BookHeart, Coins, ClipboardList } from 'lucide-react';
import './CategoryTag.css';

const CATEGORY_MAP = {
  health:     { Icon: HeartPulse,    label: 'Health',     cls: 'cat-health' },
  political:  { Icon: Landmark,      label: 'Political',  cls: 'cat-political' },
  religious:  { Icon: BookHeart,     label: 'Religious',  cls: 'cat-religious' },
  financial:  { Icon: Coins,         label: 'Financial',  cls: 'cat-financial' },
  other:      { Icon: ClipboardList, label: 'Other',      cls: 'cat-other' },
};

export default function CategoryTag({ category = 'other' }) {
  const c = CATEGORY_MAP[category] || CATEGORY_MAP.other;
  const Icon = c.Icon;
  return (
    <span className={clsx('category-tag', c.cls)}>
      <span className="category-tag-icon"><Icon size={12} /></span>
      {c.label}
    </span>
  );
}
