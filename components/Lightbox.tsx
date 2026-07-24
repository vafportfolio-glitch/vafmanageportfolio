'use client'

import { useEffect } from 'react'
import { X, Download, Lock } from 'lucide-react'
import { triggerDownload } from '@/lib/triggerDownload'

export function Lightbox({
  fileId,
  name,
  allowDownload,
  onClose,
}: {
  fileId: string
  name: string
  allowDownload: boolean
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div className="absolute top-5 right-5 flex items-center gap-2">
        {allowDownload ? (
          <button
            onClick={e => { e.stopPropagation(); triggerDownload(fileId, name) }}
            className="flex items-center gap-1.5 h-9 rounded-xl px-3.5 text-xs font-medium transition-all duration-150"
            style={{ background: 'var(--gradient-green)', color: 'var(--fg-on-brand)' }}
          >
            <Download size={14} /> Download
          </button>
        ) : (
          <span
            className="flex items-center gap-1.5 h-9 rounded-xl px-3.5 text-xs"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--fg-muted)' }}
            title="You don't have permission to download this file"
          >
            <Lock size={12} /> View only
          </span>
        )}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--fg-primary)' }}
          onClick={onClose}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        >
          <X size={18} />
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/files/${fileId}?mode=view`}
        alt={name}
        className="max-w-full max-h-full rounded-2xl object-contain"
        style={{ boxShadow: '0 32px 80px -16px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.preventDefault()}
        draggable={false}
      />
    </div>
  )
}
