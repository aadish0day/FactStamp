import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return

    previousFocus.current = document.activeElement as HTMLElement

    // Focus the first input or focusable element
    requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const firstInput = panel.querySelector<HTMLElement>('input, textarea, select')
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ;(firstInput || focusables[0])?.focus()
    })

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus.current?.focus()
    }
  }, [open, handleKeyDown])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-pop-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]',
          'w-full max-h-[85dvh] overflow-y-auto',
          'animate-dropdown-slide',
          {
            'max-w-sm': size === 'sm',
            'max-w-lg': size === 'md',
            'max-w-2xl': size === 'lg',
          }
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-soft)]">
          {title && (
            <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-fg)]">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] bg-transparent border-none text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ml-auto"
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}
