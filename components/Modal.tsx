"use client"
import { useEffect, useRef } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    lastActiveRef.current = (document.activeElement as HTMLElement) || null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        // focus trap
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (active === first || !dialogRef.current?.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (active === last || !dialogRef.current?.contains(active)) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    // initial focus (do not scroll)
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button'
      )
      first?.focus({ preventScroll: true })
    })
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      // return focus to the last active element
      lastActiveRef.current?.focus?.()
      lastActiveRef.current = null
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
      aria-hidden
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        ref={dialogRef}
        className={`w-full ${size==='lg' ? 'max-w-2xl' : 'max-w-xl'} bg-surface border border-line rounded-lg shadow-2xl p-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : <span />}
          <button onClick={onClose} aria-label="Close" className="text-muted">✕</button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto pr-1">{children}</div>
        {footer ? (
          <div className="mt-3 flex items-center gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
