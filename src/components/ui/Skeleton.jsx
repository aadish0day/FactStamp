import clsx from 'clsx';
import './ui.css';

export default function Skeleton({ width, height, borderRadius, style, className }) {
  return (
    <span
      className={clsx('skeleton', className)}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}
