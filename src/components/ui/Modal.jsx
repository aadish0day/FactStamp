import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./ui.css";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, size = "md", children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const panel = panelRef.current;
    const firstInput = panel?.querySelector("input, textarea, select");
    const focusables = panel?.querySelectorAll(FOCUSABLE);
    (firstInput || focusables?.[0])?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panel) {
        const f = panel.querySelectorAll(FOCUSABLE);
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className={`modal-panel modal-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {title && (
          <h3 className="modal-title" id="modal-title">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
