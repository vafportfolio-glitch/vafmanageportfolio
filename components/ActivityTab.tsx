'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Folder, FolderTree, FileText, Eye, Download, FolderOpen } from 'lucide-react'
import { Lightbox } from '@/components/Lightbox'
import { triggerDownload } from '@/lib/triggerDownload'
import { isImage, isPdf } from '@/lib/fileTypes'

// react-pdf touches browser-only APIs (DOMMatrix) at module load time, so it
// must never be evaluated during server-side rendering.
const PdfViewerModal = dynamic(() => import('@/components/PdfViewerModal'), { ssr: false })

export interface ActivityItem {
  id: string
  name: string
  type: 'folder' | 'subfolder' | 'file'
  createdAt: string
  creatorId: string | null
  creatorLabel: string | null
  linkFolderId: string
  mimeType?: string
}

interface Profile {
  id: string
  email: string
}

function maskEmail(email: string) {
  return email.split('@')[0]
}

function typeIcon(type: ActivityItem['type']) {
  if (type === 'file') return <FileText size={15} style={{ color: 'var(--brand-blue-400)' }} />
  if (type === 'subfolder') return <FolderTree size={15} style={{ color: 'var(--brand-green-400)' }} />
  return <Folder size={15} style={{ color: 'var(--brand-green-400)' }} />
}

function typeLabel(type: ActivityItem['type']) {
  if (type === 'file') return 'File'
  if (type === 'subfolder') return 'Subfolder'
  return 'Folder'
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function ActionButton({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="flex items-center gap-1.5 h-7 rounded-lg px-2.5 text-xs font-medium whitespace-nowrap transition-all duration-150"
      style={{
        background: primary ? 'var(--gradient-green)' : 'rgba(255,255,255,0.06)',
        color: primary ? 'var(--fg-on-brand)' : 'var(--fg-secondary)',
        border: primary ? 'none' : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

export function ActivityTab({ items, profiles }: { items: ActivityItem[]; profiles: Profile[] }) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [previewItem, setPreviewItem] = useState<ActivityItem | null>(null)
  const [pdfItem, setPdfItem] = useState<ActivityItem | null>(null)

  const filtered = selectedUserId
    ? items.filter(i => i.creatorId === selectedUserId)
    : items

  function goToFolder(id: string) {
    router.push(`/team-portal/${id}`)
  }

  return (
    <div>
      <div className="mb-4">
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--fg-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <option value="">All uploaders</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{maskEmail(p.email)}</option>
          ))}
        </select>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(18, 22, 20, 0.5)' }}
      >
        <div className="manage-access-scroll max-h-[420px] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-sm px-5 py-6" style={{ color: 'var(--fg-muted)' }}>
              {items.length === 0 ? 'Nothing created yet.' : 'No matching activity.'}
            </p>
          )}
          {filtered.map((item, i) => {
            const previewable = item.type === 'file' && !!item.mimeType && (isImage(item.mimeType) || isPdf(item.mimeType))
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-5 py-3.5"
                style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="shrink-0">{typeIcon(item.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate" style={{ color: 'var(--fg-primary)' }}>{item.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                      {typeLabel(item.type)}
                      {item.creatorLabel && <> · {item.creatorLabel}</>}
                      {' · '}{formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0 sm:justify-end pl-6 sm:pl-0">
                  {item.type === 'file' ? (
                    <>
                      {previewable && (
                        <ActionButton
                          icon={<Eye size={12} />}
                          label="View"
                          primary
                          onClick={() => {
                            if (item.mimeType && isImage(item.mimeType)) setPreviewItem(item)
                            else setPdfItem(item)
                          }}
                        />
                      )}
                      <ActionButton
                        icon={<Download size={12} />}
                        label="Download"
                        primary={!previewable}
                        onClick={() => triggerDownload(item.id, item.name)}
                      />
                      <ActionButton
                        icon={<FolderOpen size={12} />}
                        label="Go to folder"
                        onClick={() => goToFolder(item.linkFolderId)}
                      />
                    </>
                  ) : (
                    <ActionButton
                      icon={<FolderOpen size={12} />}
                      label="Open"
                      primary
                      onClick={() => goToFolder(item.linkFolderId)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {previewItem && (
        <Lightbox
          fileId={previewItem.id}
          name={previewItem.name}
          allowDownload
          onClose={() => setPreviewItem(null)}
        />
      )}

      {pdfItem && (
        <PdfViewerModal
          fileId={pdfItem.id}
          name={pdfItem.name}
          allowDownload
          onClose={() => setPdfItem(null)}
        />
      )}
    </div>
  )
}
