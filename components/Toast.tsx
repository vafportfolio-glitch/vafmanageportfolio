'use client'

import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({
  message,
  visible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [visible, onClose, duration])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-[200]"
      style={{
        animation: 'toastIn 0.3s ease-out',
      }}
    >
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg"
        style={{
          background: 'rgba(18, 22, 20, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(55,202,55,0.15)',
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
          color: 'var(--fg-primary)',
        }}
      >
        <CheckCircle size={16} style={{ color: 'var(--brand-green)' }} />
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-1 flex items-center justify-center transition-colors duration-150"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--fg-primary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--fg-muted)'
          }}
        >
          <X size={14} />
        </button>
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
