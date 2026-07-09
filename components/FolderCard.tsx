'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreVertical, Edit3, Trash2 } from 'lucide-react'

export interface FolderItem {
  id: string
  name: string
  sort_order: number
}

export function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1M4 20h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"
        fill="rgba(55,202,55,0.08)"
        stroke="url(#folderGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FolderMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="absolute top-3 right-3 z-10">
      <button
        onClick={e => {
          e.stopPropagation()
          setOpen(v => !v)
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
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
        <MoreVertical size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[170px] rounded-xl p-1.5 z-20"
          style={{
            background: 'rgba(18, 22, 20, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={e => {
              e.stopPropagation()
              setOpen(false)
              onRename()
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150"
            style={{ color: 'var(--fg-secondary)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)'
              e.currentTarget.style.color = 'var(--fg-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--fg-secondary)'
            }}
          >
            <Edit3 size={14} />
            Rename folder
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              setOpen(false)
              onDelete()
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150"
            style={{ color: 'var(--color-danger)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(209,85,74,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function FolderCard({
  folder,
  onRename,
  onDelete,
  onClick,
  fileCount,
}: {
  folder: FolderItem
  onRename: () => void
  onDelete: () => void
  onClick?: () => void
  fileCount?: number
}) {
  return (
    <div
      className="group relative rounded-2xl p-5 text-left w-full cursor-pointer transition-all duration-250 ease-out"
      style={{
        background: 'rgba(18, 22, 20, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow:
          '0 2px 20px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(55,202,55,0.2)'
        el.style.background = 'rgba(24, 28, 26, 0.7)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255,255,255,0.04)'
        el.style.background = 'rgba(18, 22, 20, 0.55)'
      }}
      onClick={onClick}
    >
      <FolderMenu onRename={onRename} onDelete={onDelete} />
      <FolderIcon />
      <span
        className="block text-sm font-semibold mt-3 truncate leading-snug pr-5"
        style={{ color: 'var(--fg-primary)' }}
      >
        {folder.name}
      </span>
      <span
        className="block text-[11px] mt-1.5 tracking-wide uppercase"
        style={{ color: 'var(--fg-muted)' }}
      >
        {fileCount !== undefined ? `${fileCount} ${fileCount === 1 ? 'file' : 'files'}` : ''}
      </span>
    </div>
  )
}
