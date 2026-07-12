import clsx from 'clsx';
import './Button.css';

const SPINNER = (
  <span className="btn-spinner" aria-hidden="true" />
);

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  children,
  className,
  type = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={clsx(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        SPINNER
      ) : (
        <>
          {Icon && <Icon size={size === 'lg' || size === 'xl' ? 18 : 16} className="btn-icon" />}
          {children && <span className="btn-label">{children}</span>}
          {IconRight && <IconRight size={size === 'lg' || size === 'xl' ? 18 : 16} className="btn-icon" />}
        </>
      )}
    </button>
  );
}
