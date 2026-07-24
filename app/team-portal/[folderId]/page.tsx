'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, ChevronLeft, ChevronRight, Upload, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/Dialog'
import { Toast } from '@/components/Toast'
import { FolderCard, FolderCardSkeleton, FolderIcon, type FolderItem } from '@/components/FolderCard'
import { FileCard, type FileItem } from '@/components/FileCard'
import { UploadDialog } from '@/components/UploadDialog'
import { useViewer } from '@/lib/ViewerEmailContext'

function getExtension(name: string) {
  const i = name.lastIndexOf('.')
  return i !== -1 ? name.slice(i) : ''
}

export default function FolderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const folderId = params.folderId as string
  const supabase = createClient()
  const { userId, canDownload: isAuthorized } = useViewer()

  type FolderNode = FolderItem & { parent_id: string | null }
  const [folder, setFolder] = useState<FolderNode | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<FolderNode[]>([])
  const [subfolders, setSubfolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creatorLabels, setCreatorLabels] = useState<Record<string, string>>({})

  // Create subfolder state
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Rename subfolder state
  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameError, setRenameError] = useState('')

  // Delete subfolder state
  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)

  // Rename file state
  const [renameFileTarget, setRenameFileTarget] = useState<FileItem | null>(null)
  const [renameFileValue, setRenameFileValue] = useState('')
  const [renamingFile, setRenamingFile] = useState(false)
  const [renameFileError, setRenameFileError] = useState('')

  // Delete file state
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileItem | null>(null)
  const [deletingFile, setDeletingFile] = useState(false)

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '' })
  const showToast = (message: string) => setToast({ visible: true, message })

  useEffect(() => {
    async function load() {
      const [{ data: folderData }, { data: subs }, { data: fileData }] = await Promise.all([
        supabase.from('folders').select('id, name, sort_order, parent_id').eq('id', folderId).single(),
        supabase.from('folders').select('id, name, sort_order').eq('parent_id', folderId).order('sort_order', { ascending: true }),
        supabase.from('files').select('id, name, original_name, file_url, mime_type, size, created_at').eq('folder_id', folderId).order('created_at', { ascending: true }),
      ])
      if (folderData) {
        setFolder(folderData)
        // Build ancestor chain for breadcrumb
        const crumbs: FolderNode[] = []
        let parentId = folderData.parent_id
        while (parentId) {
          const { data: ancestor } = await supabase
            .from('folders')
            .select('id, name, sort_order, parent_id')
            .eq('id', parentId)
            .single()
          if (!ancestor) break
          crumbs.unshift(ancestor)
          parentId = ancestor.parent_id
        }
        setBreadcrumbs(crumbs)
      }
      if (subs) setSubfolders(subs)
      if (fileData) setFiles(fileData as FileItem[])
      setLoading(false)
    }
    load()
  }, [folderId])

  // Creator labels are only ever requested for authorized viewers — the
  // route re-checks this server-side too, but non-authorized users never
  // even make the request.
  useEffect(() => {
    if (!isAuthorized || (subfolders.length === 0 && files.length === 0)) return
    fetch('/api/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folderIds: subfolders.map(f => f.id),
        fileIds: files.map(f => f.id),
      }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json) setCreatorLabels(prev => ({ ...prev, ...json.folders, ...json.files }))
      })
      .catch(() => {})
  }, [isAuthorized, subfolders, files])

  // ---- Duplicate helpers ----
  const isDupFolder = (name: string, excludeId?: string) =>
    subfolders.some(f => f.name.toLowerCase() === name.toLowerCase() && f.id !== excludeId)

  const isDupFile = (name: string, ext: string, excludeId?: string) =>
    files.some(f => {
      const fExt = getExtension(f.original_name)
      const fullName = (name + fExt).toLowerCase()
      return fullName === (f.name + fExt).toLowerCase() && f.id !== excludeId
    })

  // ---- Create subfolder ----
  function openCreate() { setIsCreating(true); setNewName('') }
  function closeCreate() { setIsCreating(false); setNewName(''); setCreating(false); setCreateError('') }
  const canCreate = newName.trim().length > 0 && !createError

  async function handleCreate() {
    if (!newName.trim()) return
    if (isDupFolder(newName.trim())) { setCreateError('A subfolder with this name already exists.'); return }
    setCreating(true)
    const name = newName.trim()
    const nextOrder = subfolders.length > 0 ? Math.max(...subfolders.map(f => f.sort_order)) + 1 : 1
    const { data, error } = await supabase
      .from('folders')
      .insert({ name, parent_id: folderId, sort_order: nextOrder, created_by: userId })
      .select('id, name, sort_order')
      .single()
    if (error || !data) { console.error(error); setCreating(false); return }
    setSubfolders(prev => [...prev, data])
    setCreating(false)
    closeCreate()
    showToast('Subfolder created successfully')
  }

  // ---- Rename subfolder ----
  function openRename(f: FolderItem) { setRenameTarget(f); setRenameValue(f.name) }
  function closeRename() { setRenameTarget(null); setRenameValue(''); setRenaming(false); setRenameError('') }
  const renameChanged = renameTarget !== null && renameValue.trim().length > 0 && renameValue.trim() !== renameTarget.name && !renameError

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return
    if (isDupFolder(renameValue.trim(), renameTarget.id)) { setRenameError('A subfolder with this name already exists.'); return }
    setRenaming(true)
    const newName = renameValue.trim()
    const { error } = await supabase.from('folders').update({ name: newName }).eq('id', renameTarget.id)
    if (error) { console.error(error); setRenaming(false); return }
    setSubfolders(prev => prev.map(f => f.id === renameTarget.id ? { ...f, name: newName } : f))
    setRenaming(false)
    closeRename()
    showToast('Subfolder renamed successfully')
  }

  // ---- Delete subfolder ----
  function openDelete(f: FolderItem) { setDeleteTarget(f) }
  function closeDelete() { setDeleteTarget(null); setDeleting(false) }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('folders').delete().eq('id', deleteTarget.id)
    if (error) { console.error(error); setDeleting(false); return }
    setSubfolders(prev => prev.filter(f => f.id !== deleteTarget.id))
    setDeleting(false)
    closeDelete()
    showToast('Subfolder deleted successfully')
  }

  // ---- Rename file ----
  function openRenameFile(f: FileItem) { setRenameFileTarget(f); setRenameFileValue(f.name) }
  function closeRenameFile() { setRenameFileTarget(null); setRenameFileValue(''); setRenamingFile(false); setRenameFileError('') }
  const renameFileChanged = renameFileTarget !== null && renameFileValue.trim().length > 0 && renameFileValue.trim() !== renameFileTarget.name && !renameFileError

  async function handleRenameFile() {
    if (!renameFileTarget || !renameFileValue.trim()) return
    const ext = getExtension(renameFileTarget.original_name)
    if (isDupFile(renameFileValue.trim(), ext, renameFileTarget.id)) {
      setRenameFileError('A file with this name already exists.')
      return
    }
    setRenamingFile(true)
    const newName = renameFileValue.trim()
    const { error } = await supabase.from('files').update({ name: newName }).eq('id', renameFileTarget.id)
    if (error) { console.error(error); setRenamingFile(false); return }
    setFiles(prev => prev.map(f => f.id === renameFileTarget.id ? { ...f, name: newName } : f))
    setRenamingFile(false)
    closeRenameFile()
    showToast('File renamed successfully')
  }

  // ---- Delete file ----
  function openDeleteFile(f: FileItem) { setDeleteFileTarget(f) }
  function closeDeleteFile() { setDeleteFileTarget(null); setDeletingFile(false) }

  async function handleDeleteFile() {
    if (!deleteFileTarget) return
    setDeletingFile(true)
    const { error } = await supabase.from('files').delete().eq('id', deleteFileTarget.id)
    if (error) { console.error(error); setDeletingFile(false); return }
    setFiles(prev => prev.filter(f => f.id !== deleteFileTarget.id))
    setDeletingFile(false)
    closeDeleteFile()
    showToast('File deleted successfully')
  }

  const existingFileNames = files.map(f => f.name + getExtension(f.original_name))
  const hasContent = subfolders.length > 0 || files.length > 0

  return (
    <div className="w-full mx-auto px-6 pt-16 pb-24 relative" style={{ maxWidth: '1400px' }}>
      {/* SVG defs */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <linearGradient id="folderGrad" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="var(--brand-green-400)" />
            <stop offset="100%" stopColor="var(--brand-blue-400)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Background blobs */}
      <div className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--brand-green-400) 0%, transparent 70%)', transform: 'translate(-30%, -30%)', opacity: 0.03 }} />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--brand-blue-400) 0%, transparent 70%)', transform: 'translate(30%, 30%)', opacity: 0.025 }} />

      {/* Toolbar: back left, actions right */}
      <div className="flex items-center justify-between mb-6">
        {/* Back button */}
        <button
          onClick={() => router.push(folder?.parent_id ? `/team-portal/${folder.parent_id}` : '/team-portal')}
          className="h-9 rounded-xl flex items-center gap-1.5 px-3 shrink-0 transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--fg-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--fg-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--fg-secondary)' }}
        >
          <ChevronLeft size={15} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Right actions */}
        {folder && (
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="h-9 rounded-xl flex items-center gap-2 px-3.5 shrink-0 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--fg-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--fg-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--fg-secondary)' }}
            >
              <Plus size={15} />
              <span className="text-sm font-medium">Add subfolder</span>
            </button>
            <button
              onClick={() => setIsUploading(true)}
              className="h-9 rounded-xl flex items-center gap-2 px-3.5 shrink-0 transition-all duration-200"
              style={{ background: 'var(--gradient-green)', boxShadow: '0 4px 16px -4px rgba(55,202,55,0.25)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--gradient-green-hover)'; e.currentTarget.style.boxShadow = '0 6px 24px -4px rgba(55,202,55,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--gradient-green)'; e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(55,202,55,0.25)' }}
            >
              <Upload size={15} style={{ color: 'var(--fg-on-brand)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--fg-on-brand)' }}>Upload file</span>
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 flex-wrap mb-8">
        {/* Home */}
        <button
          onClick={() => router.push('/team-portal')}
          className="flex items-center gap-1 text-xs transition-all duration-150 rounded-md px-1.5 py-1 hover:opacity-80"
          style={{ color: 'var(--fg-muted)' }}
        >
          <Home size={12} />
          <span>All categories</span>
        </button>
        {/* Ancestor folders */}
        {breadcrumbs.map(crumb => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight size={11} style={{ color: 'var(--fg-muted)', opacity: 0.4 }} />
            <button
              onClick={() => router.push(`/team-portal/${crumb.id}`)}
              className="text-xs px-1.5 py-1 rounded-md transition-all duration-150 hover:opacity-80"
              style={{ color: 'var(--fg-muted)' }}
            >
              {crumb.name}
            </button>
          </span>
        ))}
        {/* Current folder */}
        {folder && (
          <span className="flex items-center gap-1">
            <ChevronRight size={11} style={{ color: 'var(--fg-muted)', opacity: 0.4 }} />
            <span className="text-xs px-1.5 py-1 font-medium" style={{ color: 'var(--fg-primary)' }}>
              {folder.name}
            </span>
          </span>
        )}
      </nav>

      {/* Hero */}
      <div className="mb-10">
        <h1
          className="text-[2rem] md:text-[2.75rem] font-semibold tracking-[-0.03em] leading-[1.1] mb-3"
          style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
        >
          {folder?.name}
        </h1>
        <p className="text-sm max-w-md" style={{ color: 'var(--fg-muted)' }}>
          Browse subfolders and files in this category.
        </p>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <FolderCardSkeleton key={i} />
            ))}
          </div>
        ) : !hasContent ? (
          <div className="flex flex-col items-center gap-4 pt-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(55,202,55,0.06)', border: '1px solid rgba(55,202,55,0.1)' }}>
              <FolderIcon />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--fg-primary)' }}>Nothing here yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>Add a subfolder or upload a file to get started.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Subfolders */}
            {subfolders.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--fg-muted)' }}>
                  Subfolders · {subfolders.length}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {subfolders.map(sf => (
                    <FolderCard
                      key={sf.id}
                      folder={sf}
                      onRename={() => openRename(sf)}
                      onDelete={() => openDelete(sf)}
                      onClick={() => router.push(`/team-portal/${sf.id}`)}
                      createdByLabel={creatorLabels[sf.id] ?? null}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--fg-muted)' }}>
                  Files · {files.length}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {files.map(f => (
                    <FileCard
                      key={f.id}
                      file={f}
                      onRename={() => openRenameFile(f)}
                      onDelete={() => openDeleteFile(f)}
                      uploadedByLabel={creatorLabels[f.id] ?? null}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <UploadDialog
        open={isUploading}
        onClose={() => setIsUploading(false)}
        folderId={folderId}
        existingNames={existingFileNames}
        onUploaded={f => { setFiles(prev => [...prev, f]); showToast('File uploaded successfully') }}
      />

      {/* Create subfolder dialog */}
      <Dialog open={isCreating} onClose={closeCreate} title="Add subfolder">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
              Adding subfolder in <strong style={{ color: 'var(--fg-primary)' }}>{folder?.name}</strong>
            </p>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>Subfolder name</label>
            <input
              type="text" value={newName}
              onChange={e => { setNewName(e.target.value); setCreateError('') }}
              onKeyDown={e => { if (e.key === 'Enter' && canCreate && !creating) handleCreate() }}
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-primary)', border: createError ? '1px solid rgba(209,85,74,0.6)' : '1px solid var(--border-default)' }}
              onFocus={e => { if (!createError) e.currentTarget.style.borderColor = 'var(--brand-green)' }}
              onBlur={e => { if (!createError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
            />
            {createError && <p className="text-xs mt-1.5" style={{ color: 'rgb(209,85,74)' }}>{createError}</p>}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={closeCreate} disabled={creating}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!newName.trim() || !!createError || creating} onClick={handleCreate}>
              {creating ? <span className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--fg-on-brand)', borderRightColor: 'var(--fg-on-brand)' }} />Adding...</span> : 'Add subfolder'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Rename subfolder dialog */}
      <Dialog open={renameTarget !== null} onClose={closeRename} title="Rename subfolder">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>Subfolder name</label>
            <input
              type="text" value={renameValue}
              onChange={e => { setRenameValue(e.target.value); setRenameError('') }}
              onKeyDown={e => { if (e.key === 'Enter' && renameChanged && !renaming) handleRename() }}
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'var(--bg-surface)', color: 'var(--fg-primary)', border: renameError ? '1px solid rgba(209,85,74,0.6)' : '1px solid var(--border-default)' }}
              onFocus={e => { if (!renameError) e.currentTarget.style.borderColor = 'var(--brand-green)' }}
              onBlur={e => { if (!renameError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
            />
            {renameError && <p className="text-xs mt-1.5" style={{ color: 'rgb(209,85,74)' }}>{renameError}</p>}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={closeRename} disabled={renaming}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!renameChanged || renaming} onClick={handleRename}>
              {renaming ? <span className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--fg-on-brand)', borderRightColor: 'var(--fg-on-brand)' }} />Renaming...</span> : 'Rename subfolder'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete subfolder dialog */}
      <Dialog open={deleteTarget !== null} onClose={closeDelete} title="Delete subfolder">
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--fg-primary)' }}>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={closeDelete} disabled={deleting}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? <span className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--fg-on-brand)', borderRightColor: 'var(--fg-on-brand)' }} />Deleting...</span> : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Rename file dialog */}
      <Dialog open={renameFileTarget !== null} onClose={closeRenameFile} title="Rename file">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>File name</label>
            <div className="flex items-center">
              <input
                type="text" value={renameFileValue}
                onChange={e => { setRenameFileValue(e.target.value); setRenameFileError('') }}
                onKeyDown={e => { if (e.key === 'Enter' && renameFileChanged && !renamingFile) handleRenameFile() }}
                autoFocus
                className="flex-1 h-10 px-3.5 rounded-l-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--bg-surface)', color: 'var(--fg-primary)', border: renameFileError ? '1px solid rgba(209,85,74,0.6)' : '1px solid var(--border-default)', borderRight: 'none' }}
                onFocus={e => { if (!renameFileError) e.currentTarget.style.borderColor = 'var(--brand-green)' }}
                onBlur={e => { if (!renameFileError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
              />
              <span className="h-10 px-3 flex items-center text-sm rounded-r-xl shrink-0"
                style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}>
                {renameFileTarget ? getExtension(renameFileTarget.original_name) : ''}
              </span>
            </div>
            {renameFileError && <p className="text-xs mt-1.5" style={{ color: 'rgb(209,85,74)' }}>{renameFileError}</p>}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={closeRenameFile} disabled={renamingFile}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!renameFileChanged || renamingFile} onClick={handleRenameFile}>
              {renamingFile ? <span className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--fg-on-brand)', borderRightColor: 'var(--fg-on-brand)' }} />Renaming...</span> : 'Rename file'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete file dialog */}
      <Dialog open={deleteFileTarget !== null} onClose={closeDeleteFile} title="Delete file">
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--fg-primary)' }}>{deleteFileTarget?.name}{deleteFileTarget ? getExtension(deleteFileTarget.original_name) : ''}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={closeDeleteFile} disabled={deletingFile}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={deletingFile} onClick={handleDeleteFile}>
              {deletingFile ? <span className="flex items-center gap-2"><span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--fg-on-brand)', borderRightColor: 'var(--fg-on-brand)' }} />Deleting...</span> : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ visible: false, message: '' })} />
    </div>
  )
}
