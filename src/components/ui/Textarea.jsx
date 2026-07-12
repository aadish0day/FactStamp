import clsx from 'clsx';
import { AlertTriangle, Check } from 'lucide-react';
import './Input.css';

export default function Textarea({
  label,
  helper,
  error,
  success,
  prefix,
  suffix,
  className,
  id,
  rows = 5,
  ...rest
}) {
  const state = error ? 'error' : success ? 'success' : 'default';
  return (
    <div className={clsx('input-wrap', className)}>
      {label && (
        <label className={clsx('input-label', `input-label-${state}`)} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={clsx('input-field', 'textarea-field', `input-field-${state}`)}>
        <textarea id={id} className="input-el" rows={rows} {...rest} />
      </div>
      {error ? (
        <p className="input-msg input-msg-error">
          <AlertTriangle size={12} /> {error}
        </p>
      ) : success ? (
        <p className="input-msg input-msg-success">
          <Check size={12} /> {success}
        </p>
      ) : helper ? (
        <p className="input-msg input-msg-helper">{helper}</p>
      ) : null}
    </div>
  );
}
