'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Folder, FolderTree, FileText } from 'lucide-react'

export interface ActivityItem {
  id: string
  name: string
  type: 'folder' | 'subfolder' | 'file'
  createdAt: string
  creatorId: string | null
  creatorLabel: string | null
  linkFolderId: string
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

export function ActivityTab({ items, profiles }: { items: ActivityItem[]; profiles: Profile[] }) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState('')

  const filtered = selectedUserId
    ? items.filter(i => i.creatorId === selectedUserId)
    : items

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
          {filtered.map((item, i) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => router.push(`/team-portal/${item.linkFolderId}`)}
              className="flex items-center gap-3 w-full px-5 py-3.5 text-left transition-all duration-150"
              style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span className="shrink-0">{typeIcon(item.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate" style={{ color: 'var(--fg-primary)' }}>{item.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  {typeLabel(item.type)}
                  {item.creatorLabel && <> · {item.creatorLabel}</>}
                </p>
              </div>
              <span className="text-[11px] shrink-0 text-right" style={{ color: 'var(--fg-muted)' }}>
                {formatDateTime(item.createdAt)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
