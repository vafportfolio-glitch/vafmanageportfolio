'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/Dialog'
import { Toast } from '@/components/Toast'
import { FolderCard, FolderCardSkeleton, type FolderItem } from '@/components/FolderCard'
import { useViewer } from '@/lib/ViewerEmailContext'

export default function TeamPortalPage() {
  const router = useRouter()
  const { userId, canDownload: isAuthorized } = useViewer()
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const [creatorLabels, setCreatorLabels] = useState<Record<string, string>>({})
  const supabase = createClient()

  // Create state
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Rename state
  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState('')

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (message: string) => {
    setToast({ visible: true, message })
  }

  useEffect(() => {
    supabase
      .from('folders')
      .select('id, name, sort_order')
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setFolders(data)
        setLoading(false)
      })
  }, [])

  // Creator labels are only ever requested for authorized viewers — the
  // route re-checks this server-side too, but non-authorized users never
  // even make the request.
  useEffect(() => {
    if (!isAuthorized || folders.length === 0) return
    fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderIds: folders.map(f => f.id), fileIds: [] }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(json => { if (json) setCreatorLabels(prev => ({ ...prev, ...json.folders })) })
      .catch(() => {})
  }, [isAuthorized, folders])

  const filtered = folders.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  // ---- Create handlers ----
  function openCreate() {
    setIsCreating(true)
    setNewFolderName('')
  }

  function closeCreate() {
    setIsCreating(false)
    setNewFolderName('')
    setCreating(false)
    setCreateError('')
  }

  const isDuplicateName = (name: string, excludeId?: string) =>
    folders.some(
      f => f.name.toLowerCase() === name.toLowerCase() && f.id !== excludeId
    )

  const canCreate = newFolderName.trim().length > 0 && !createError

  async function handleCreate() {
    if (!newFolderName.trim()) return
    if (isDuplicateName(newFolderName.trim())) {
      setCreateError('A category with this name already exists.')
      return
    }
    setCreating(true)
    const name = newFolderName.trim()
    const nextOrder = folders.length > 0
      ? Math.max(...folders.map(f => f.sort_order)) + 1
      : 1

    const { data, error } = await supabase
      .from('folders')
      .insert({ name, parent_id: null, sort_order: nextOrder, created_by: userId })
      .select('id, name, sort_order')
      .single()

    if (error || !data) {
      console.error(error)
      setCreating(false)
      return
    }

    setFolders(prev => [...prev, data])
    setCreating(false)
    closeCreate()
    showToast('Folder created successfully')
  }

  // ---- Rename handlers ----
  function openRename(folder: FolderItem) {
    setRenameTarget(folder)
    setRenameValue(folder.name)
  }

  function closeRename() {
    setRenameTarget(null)
    setRenameValue('')
    setRenaming(false)
    setRenameError('')
  }

  const renameChanged =
    renameTarget !== null &&
    renameValue.trim().length > 0 &&
    renameValue.trim() !== renameTarget.name &&
    !renameError

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return
    if (isDuplicateName(renameValue.trim(), renameTarget.id)) {
      setRenameError('A category with this name already exists.')
      return
    }
    setRenaming(true)
    const newName = renameValue.trim()

    const { error } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', renameTarget.id)

    if (error) {
      console.error(error)
      setRenaming(false)
      return
    }

    setFolders(prev =>
      prev.map(f => (f.id === renameTarget.id ? { ...f, name: newName } : f))
    )
    setRenaming(false)
    closeRename()
    showToast('Folder renamed successfully')
  }

  // ---- Delete handlers ----
  function openDelete(folder: FolderItem) {
    setDeleteTarget(folder)
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDeleting(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      console.error(error)
      setDeleting(false)
      return
    }

    setFolders(prev => prev.filter(f => f.id !== deleteTarget.id))
    setDeleting(false)
    closeDelete()
    showToast('Folder deleted successfully')
  }

  return (
    <div
      className="w-full mx-auto px-6 pt-16 pb-24 relative"
      style={{ maxWidth: '1400px' }}
    >
      {/* Shared SVG defs */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <linearGradient id="folderGrad" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="var(--brand-green-400)" />
            <stop offset="100%" stopColor="var(--brand-blue-400)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background blobs */}
      <div
        className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, var(--brand-green-400) 0%, transparent 70%)',
          transform: 'translate(-30%, -30%)',
          opacity: 0.03,
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, var(--brand-blue-400) 0%, transparent 70%)',
          transform: 'translate(30%, 30%)',
          opacity: 0.025,
        }}
      />

      {/* ---- Hero ---- */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-3">
          <h1
            className="text-[2rem] md:text-[2.75rem] font-semibold tracking-[-0.03em] leading-[1.1]"
            style={{
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Portfolio Projects
          </h1>
          <div
            className="w-0.5 h-8 rounded-full shrink-0"
            style={{ background: 'var(--gradient-brand)', opacity: 0.4 }}
          />
          <span
            className="text-[11px] font-medium tracking-wider uppercase rounded-full px-3 py-1 shrink-0"
            style={{
              background: 'rgba(55,202,55,0.08)',
              border: '1px solid rgba(55,202,55,0.12)',
              color: 'var(--brand-green-400)',
            }}
          >
            {loading
              ? 'Loading...'
              : `${filtered.length} ${filtered.length === 1 ? 'category' : 'categories'}`}
          </span>
        </div>
        <p className="text-sm max-w-md" style={{ color: 'var(--fg-muted)' }}>
          Browse all project categories and quickly access your work.
        </p>
      </div>

      {/* ---- Search + Add button ---- */}
      <div className="flex items-center mb-10">
        <div className="relative max-w-lg flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: 'var(--fg-muted)' }}
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl text-sm outline-none transition-all duration-300"
            style={{
              background: 'rgba(18, 22, 20, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: 'var(--fg-primary)',
              border: focused
                ? '1px solid rgba(55,202,55,0.25)'
                : '1px solid rgba(255,255,255,0.05)',
              boxShadow: focused
                ? '0 0 24px -4px rgba(55,202,55,0.12), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 2px 12px -6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          />
        </div>
        <button
          onClick={openCreate}
          className="h-12 rounded-2xl flex items-center gap-2 px-5 shrink-0 transition-all duration-200 ml-auto"
          style={{
            background: 'var(--gradient-green)',
            boxShadow: '0 4px 16px -4px rgba(55,202,55,0.25)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--gradient-green-hover)'
            e.currentTarget.style.boxShadow =
              '0 6px 24px -4px rgba(55,202,55,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--gradient-green)'
            e.currentTarget.style.boxShadow =
              '0 4px 16px -4px rgba(55,202,55,0.25)'
          }}
        >
          <Plus size={18} style={{ color: 'var(--fg-on-brand)' }} />
          <span
            className="text-sm font-medium whitespace-nowrap"
            style={{ color: 'var(--fg-on-brand)' }}
          >
            Add folder
          </span>
        </button>
      </div>

      {/* ---- Grid ---- */}
      <div>
        {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <FolderCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(folder => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => router.push(`/team-portal/${folder.id}`)}
              onRename={() => openRename(folder)}
              onDelete={() => openDelete(folder)}
              createdByLabel={creatorLabels[folder.id] ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 pt-16">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(55,202,55,0.06)',
              border: '1px solid rgba(55,202,55,0.1)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1M4 20h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"
                fill="rgba(55,202,55,0.08)"
                stroke="url(#folderGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>
              No categories found
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>
              Try searching for another keyword.
            </p>
          </div>
        </div>
      )}
      </div>

      {/* ---- Create Dialog ---- */}
      <Dialog
        open={isCreating}
        onClose={closeCreate}
        title="Add folder"
      >
        <div className="flex flex-col gap-5">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--fg-muted)' }}
            >
              Folder name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={e => {
                setNewFolderName(e.target.value)
                setCreateError('')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && canCreate && !creating) {
                  handleCreate()
                }
              }}
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--fg-primary)',
                border: createError ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border-default)',
              }}
              onFocus={e => {
                if (!createError) e.currentTarget.style.borderColor = 'var(--brand-green)'
              }}
              onBlur={e => {
                if (!createError) e.currentTarget.style.borderColor = 'var(--border-default)'
              }}
            />
            {createError && (
              <p className="text-xs mt-1.5" style={{ color: 'rgb(239,68,68)' }}>{createError}</p>
            )}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeCreate}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newFolderName.trim() || !!createError || creating}
              onClick={handleCreate}
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin"
                    style={{
                      borderTopColor: 'var(--fg-on-brand)',
                      borderRightColor: 'var(--fg-on-brand)',
                    }}
                  />
                  Adding...
                </span>
              ) : (
                'Add folder'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ---- Rename Dialog ---- */}
      <Dialog
        open={renameTarget !== null}
        onClose={closeRename}
        title="Rename folder"
      >
        <div className="flex flex-col gap-5">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--fg-muted)' }}
            >
              Folder name
            </label>
            <input
              type="text"
              value={renameValue}
              onChange={e => {
                setRenameValue(e.target.value)
                setRenameError('')
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && renameChanged && !renaming) {
                  handleRename()
                }
              }}
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--fg-primary)',
                border: renameError ? '1px solid rgba(239,68,68,0.6)' : '1px solid var(--border-default)',
              }}
              onFocus={e => {
                if (!renameError) e.currentTarget.style.borderColor = 'var(--brand-green)'
              }}
              onBlur={e => {
                if (!renameError) e.currentTarget.style.borderColor = 'var(--border-default)'
              }}
            />
            {renameError && (
              <p className="text-xs mt-1.5" style={{ color: 'rgb(239,68,68)' }}>{renameError}</p>
            )}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeRename}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!renameChanged || renaming}
              onClick={handleRename}
            >
              {renaming ? (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin"
                    style={{
                      borderTopColor: 'var(--fg-on-brand)',
                      borderRightColor: 'var(--fg-on-brand)',
                    }}
                  />
                  Renaming...
                </span>
              ) : (
                'Rename folder'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ---- Delete Dialog ---- */}
      <Dialog
        open={deleteTarget !== null}
        onClose={closeDelete}
        title="Delete folder"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--fg-primary)' }}>
              {deleteTarget?.name}
            </strong>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin"
                    style={{
                      borderTopColor: 'var(--fg-on-brand)',
                      borderRightColor: 'var(--fg-on-brand)',
                    }}
                  />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ---- Toast ---- */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '' })}
      />
    </div>
  )
}
