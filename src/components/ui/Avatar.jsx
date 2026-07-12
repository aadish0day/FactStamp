import clsx from 'clsx';
import './ui.css';

export default function Avatar({ name = '', size = 32, className }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className={clsx('avatar', className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
