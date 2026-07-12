import clsx from 'clsx';
import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';
import './Input.css';

export default function Input({
  label,
  helper,
  error,
  success,
  prefix,
  suffix,
  type = 'text',
  className,
  id,
  ...rest
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;
  const state = error ? 'error' : success ? 'success' : 'default';

  return (
    <div className={clsx('input-wrap', className)}>
      {label && (
        <label className={clsx('input-label', `input-label-${state}`)} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={clsx('input-field', `input-field-${state}`)}>
        {prefix && <span className="input-affix input-prefix">{prefix}</span>}
        <input id={id} type={inputType} className="input-el" {...rest} />
        {isPassword && (
          <button
            type="button"
            className="input-affix input-toggle"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {suffix && !isPassword && <span className="input-affix input-suffix">{suffix}</span>}
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
