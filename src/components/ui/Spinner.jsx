import clsx from 'clsx';
import './ui.css';

export default function Spinner({ size = 16, className }) {
  return (
    <span
      className={clsx('spinner', className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
