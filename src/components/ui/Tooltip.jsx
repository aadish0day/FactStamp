import clsx from 'clsx';
import { useState } from 'react';
import './ui.css';

export default function Tooltip({ label, children, position = 'top' }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && <span className={clsx('tooltip', `tooltip-${position}`)}>{label}</span>}
    </span>
  );
}
