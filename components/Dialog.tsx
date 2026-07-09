'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'rgba(18, 22, 20, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow:
            '0 24px 80px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-surface-hover)'
            e.currentTarget.style.color = 'var(--fg-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--fg-muted)'
          }}
        >
          <X size={16} />
        </button>

        {title && (
          <h2
            className="text-base font-semibold mb-5 pr-6"
            style={{ color: 'var(--fg-primary)' }}
          >
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  )
}
