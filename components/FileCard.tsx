'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { MoreVertical, Edit3, Trash2, Copy, Check, X, ExternalLink, Download, Lock } from 'lucide-react'
import { useViewer } from '@/lib/ViewerEmailContext'

// react-pdf touches browser-only APIs (DOMMatrix) at module load time, so it
// must never be evaluated during server-side rendering.
const PdfViewerModal = dynamic(() => import('@/components/PdfViewerModal'), { ssr: false })

export interface FileItem {
  id: string
  name: string
  original_name: string
  file_url: string
  mime_type: string
  size: number
  created_at: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getExtension(name: string) {
  const i = name.lastIndexOf('.')
  return i !== -1 ? name.slice(i).toLowerCase() : ''
}

function triggerDownload(fileId: string, filename: string) {
  const a = document.createElement('a')
  a.href = `/api/files/${fileId}?mode=download`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function isImage(mime: string) { return mime.startsWith('image/') }
function isPdf(mime: string) { return mime === 'application/pdf' }
function isSpreadsheet(mime: string) {
  return mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv'
}

// ---- Preview thumbnail components ----

function ImagePreview({ fileId, name }: { fileId: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="w-full h-full relative overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: 'var(--brand-green-400)', borderRightColor: 'var(--brand-green-400)' }} />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/files/${fileId}?mode=thumb`}
        alt={name}
        onLoad={() => setLoaded(true)}
        onContextMenu={e => e.preventDefault()}
        draggable={false}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  )
}

function PdfPreview({ fileId, name }: { fileId: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  return (
    <div className="w-full h-full relative overflow-hidden">
      {!loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: '#e05c4a', borderRightColor: '#e05c4a' }} />
        </div>
      )}
      {errored ? (
        <PdfFallback name={name} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/files/${fileId}?mode=thumb`}
          alt={name}
          onLoad={() => setLoaded(true)}
          onError={() => { setErrored(true); setLoaded(true) }}
          onContextMenu={e => e.preventDefault()}
          draggable={false}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </div>
  )
}

function PdfFallback({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3"
      style={{ background: 'rgba(224,92,74,0.06)' }}>
      {/* PDF icon */}
      <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
        <rect width="28" height="34" rx="4" fill="rgba(224,92,74,0.15)" />
        <rect x="4" y="4" width="20" height="26" rx="2" fill="rgba(224,92,74,0.1)" stroke="rgba(224,92,74,0.4)" strokeWidth="1" />
        <text x="14" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#e05c4a">PDF</text>
      </svg>
      <span className="text-[10px] text-center truncate w-full px-1" style={{ color: 'rgba(224,92,74,0.8)' }}>{name}</span>
    </div>
  )
}

function SpreadsheetPreview({ name, ext }: { name: string; ext: string }) {
  const cols = 4
  const rows = 5
  const isXlsx = ext === '.xlsx' || ext === '.xls'
  const accentColor = '#4caf7d'
  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgba(76,175,125,0.04)' }}>
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 shrink-0"
        style={{ background: 'rgba(76,175,125,0.08)', borderBottom: '1px solid rgba(76,175,125,0.12)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="rgba(76,175,125,0.2)" stroke={accentColor} strokeWidth="1.5" />
          <line x1="3" y1="9" x2="21" y2="9" stroke={accentColor} strokeWidth="1" />
          <line x1="3" y1="15" x2="21" y2="15" stroke={accentColor} strokeWidth="1" />
          <line x1="9" y1="3" x2="9" y2="21" stroke={accentColor} strokeWidth="1" />
          <line x1="15" y1="3" x2="15" y2="21" stroke={accentColor} strokeWidth="1" />
        </svg>
        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: accentColor }}>
          {isXlsx ? 'Excel' : 'CSV'}
        </span>
      </div>
      {/* Mock grid */}
      <div className="flex-1 overflow-hidden p-1.5">
        <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`, gap: '2px' }}>
          {Array.from({ length: cols * rows }).map((_, i) => {
            const isHeader = i < cols
            const widths = [60, 40, 50, 35]
            const w = widths[i % cols]
            return (
              <div key={i} className="rounded-sm flex items-center px-1"
                style={{ background: isHeader ? 'rgba(76,175,125,0.12)' : 'rgba(255,255,255,0.03)' }}>
                <div className="rounded-sm" style={{
                  height: '4px',
                  width: `${w}%`,
                  background: isHeader ? 'rgba(76,175,125,0.5)' : 'rgba(255,255,255,0.12)',
                }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- Lightbox ----
function Lightbox({
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

// ---- Main FileCard ----
export function FileCard({
  file,
  onRename,
  onDelete,
  uploadedByLabel,
}: {
  file: FileItem
  onRename: () => void
  onDelete: () => void
  uploadedByLabel?: string | null
}) {
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [denied, setDenied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { canDownload: allowed } = useViewer()

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/api/files/${file.id}?mode=view`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePreviewClick() {
    if (isImage(file.mime_type)) { setLightbox(true); return }
    if (isPdf(file.mime_type)) { setPdfViewerOpen(true); return }
    if (isSpreadsheet(file.mime_type)) {
      // Browsers have no read-only viewer for xlsx/csv — opening it IS downloading it,
      // so non-permitted users get a denial instead of a file.
      if (allowed) {
        triggerDownload(file.id, displayName)
      } else {
        setDenied(true)
        setTimeout(() => setDenied(false), 2500)
      }
      return
    }
  }

  const ext = getExtension(file.original_name)
  const displayName = file.name + ext
  const clickable = isImage(file.mime_type) || isPdf(file.mime_type) || isSpreadsheet(file.mime_type)

  return (
    <>
      <div
        className="group relative rounded-2xl overflow-hidden transition-all duration-200 flex flex-col"
        style={{
          background: 'rgba(18, 22, 20, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.04)',
          boxShadow: '0 2px 20px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(55,202,55,0.15)'
          e.currentTarget.style.background = 'rgba(24, 28, 26, 0.7)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.background = 'rgba(18, 22, 20, 0.55)'
        }}
      >
        {/* Preview area */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: '120px', cursor: clickable ? 'pointer' : 'default' }}
          onClick={handlePreviewClick}
        >
          {isImage(file.mime_type) && <ImagePreview fileId={file.id} name={displayName} />}
          {isPdf(file.mime_type) && <PdfPreview fileId={file.id} name={displayName} />}
          {isSpreadsheet(file.mime_type) && <SpreadsheetPreview name={displayName} ext={ext} />}

          {/* Hover overlay for clickable types */}
          {clickable && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(8px)' }}>
                <ExternalLink size={12} />
                {isImage(file.mime_type) ? 'View' : 'Open'}
              </div>
            </div>
          )}

          {/* Permission-denied toast for spreadsheet clicks */}
          {denied && (
            <div
              className="absolute inset-0 flex items-center justify-center text-center px-3"
              style={{ background: 'rgba(0,0,0,0.75)' }}
            >
              <span className="text-[11px] font-medium" style={{ color: 'white' }}>
                You don&apos;t have permission to download this file.
              </span>
            </div>
          )}
        </div>

        {/* Bottom info row */}
        <div className="flex items-center justify-between px-3 py-2.5 gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate leading-snug" style={{ color: 'var(--fg-primary)' }} title={displayName}>
              {displayName}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              {formatBytes(file.size)}
            </p>
            {uploadedByLabel && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--fg-muted)', opacity: 0.7 }}>
                Uploaded by {uploadedByLabel}
              </p>
            )}
          </div>

          {/* Menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: 'var(--fg-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--fg-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--fg-muted)' }}
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 min-w-[155px] rounded-xl p-1.5 z-20"
                style={{
                  background: 'rgba(18, 22, 20, 0.95)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 12px 40px -8px rgba(0,0,0,0.5)',
                }}
              >
                {[
                  { icon: copied ? <Check size={13} /> : <Copy size={13} />, label: copied ? 'Copied!' : 'Copy link', action: copyLink, danger: false },
                  { icon: <Edit3 size={13} />, label: 'Rename', action: () => { setMenuOpen(false); onRename() }, danger: false },
                  { icon: <Trash2 size={13} />, label: 'Delete', action: () => { setMenuOpen(false); onDelete() }, danger: true },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150"
                    style={{ color: item.danger ? 'var(--color-danger)' : 'var(--fg-secondary)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = item.danger ? 'rgba(209,85,74,0.1)' : 'var(--bg-surface-hover)'
                      if (!item.danger) e.currentTarget.style.color = 'var(--fg-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = item.danger ? 'var(--color-danger)' : 'var(--fg-secondary)'
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          fileId={file.id}
          name={displayName}
          allowDownload={allowed}
          onClose={() => setLightbox(false)}
        />
      )}

      {/* PDF viewer */}
      {pdfViewerOpen && (
        <PdfViewerModal
          fileId={file.id}
          name={displayName}
          allowDownload={allowed}
          onClose={() => setPdfViewerOpen(false)}
        />
      )}
    </>
  )
}
