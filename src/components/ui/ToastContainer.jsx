import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './ui.css';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export default function Toast({ toast, onClose }) {
  const Icon = ICONS[toast.type] || Info;
  return (
    <div className={`toast toast-${toast.type}`} role="status">
      <Icon size={18} className="toast-icon" />
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={() => onClose(toast.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  return createPortal(
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
}
