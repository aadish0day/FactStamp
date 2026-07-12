import clsx from 'clsx';
import './ui.css';

export default function Tag({ tone = 'neutral', children, className }) {
  return (
    <span className={clsx('tag', `tag-${tone}`, className)}>{children}</span>
  );
}
