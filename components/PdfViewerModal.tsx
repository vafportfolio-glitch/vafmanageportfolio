'use client'

import { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Download, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react'
import { triggerDownload } from '@/lib/triggerDownload'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

// ---- PDF viewer (canvas-rendered, no native browser download button) ----
export default function PdfViewerModal({
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
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNum, setPageNum] = useState(1)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between w-full max-w-3xl mb-3 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-sm truncate pr-3" style={{ color: 'var(--fg-primary)' }}>{name}</span>
        <div className="flex items-center gap-2 shrink-0">
          {allowDownload ? (
            <button
              onClick={() => triggerDownload(fileId, name)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150"
              style={{ background: 'var(--gradient-green)', color: 'var(--fg-on-brand)' }}
            >
              <Download size={13} /> Download
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--fg-muted)' }}
              title="You don't have permission to download this file"
            >
              <Lock size={12} /> View only
            </span>
          )}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--fg-primary)' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Page */}
      <div
        className="flex-1 overflow-auto rounded-xl"
        onClick={e => e.stopPropagation()}
        onContextMenu={e => e.preventDefault()}
      >
        {failed ? (
          <div className="flex items-center justify-center h-full px-6 text-sm" style={{ color: 'var(--fg-muted)' }}>
            Couldn&apos;t load this PDF.
          </div>
        ) : (
          <Document
            file={`/api/files/${fileId}?mode=view`}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setFailed(true)}
            loading={
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
                  style={{ borderTopColor: '#e05c4a', borderRightColor: '#e05c4a' }} />
              </div>
            }
          >
            <Page
              pageNumber={pageNum}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={Math.min(760, typeof window !== 'undefined' ? window.innerWidth - 48 : 760)}
            />
          </Document>
        )}
      </div>

      {/* Pager */}
      {numPages && numPages > 1 && (
        <div
          className="flex items-center gap-3 mt-3 shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <button
            disabled={pageNum <= 1}
            onClick={() => setPageNum(p => Math.max(1, p - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--fg-primary)' }}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs" style={{ color: 'var(--fg-secondary)' }}>
            Page {pageNum} of {numPages}
          </span>
          <button
            disabled={pageNum >= numPages}
            onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 transition-all duration-150"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--fg-primary)' }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
