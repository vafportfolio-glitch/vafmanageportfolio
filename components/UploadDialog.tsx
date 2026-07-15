'use client'

import { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, X, FileText, FileImage, FileSpreadsheet, File } from 'lucide-react'
import { Dialog } from '@/components/Dialog'
import { Button } from '@/components/ui/Button'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { createClient } from '@/lib/supabase/client'
import type { FileItem } from '@/components/FileCard'

const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ACCEPT_ATTR = [...ACCEPTED_TYPES].join(',')
const SUPPORTED_LABEL = 'JPG, PNG, GIF, WEBP, SVG, PDF, XLS, XLSX, CSV, DOC, DOCX'

function getExtension(filename: string) {
  const i = filename.lastIndexOf('.')
  return i !== -1 ? filename.slice(i) : ''
}
function getBaseName(filename: string) {
  const i = filename.lastIndexOf('.')
  return i !== -1 ? filename.slice(0, i) : filename
}

type FileStatus = 'idle' | 'uploading' | 'done' | 'error'

interface FileEntry {
  id: string
  file: File
  name: string       // editable base name
  nameError: string
  progress: number
  status: FileStatus
  errorMsg: string
}

function FileTypeIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <FileImage size={14} style={{ color: 'var(--brand-blue-400)' }} />
  if (mime === 'application/pdf') return <FileText size={14} style={{ color: '#e05c4a' }} />
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return <FileSpreadsheet size={14} style={{ color: '#4caf7d' }} />
  if (mime.includes('msword') || mime.includes('wordprocessingml'))
    return <FileText size={14} style={{ color: '#4a90d9' }} />
  return <File size={14} style={{ color: 'var(--fg-muted)' }} />
}

interface Props {
  open: boolean
  onClose: () => void
  folderId: string
  existingNames: string[]
  onUploaded: (file: FileItem) => void
}

export function UploadDialog({ open, onClose, folderId, existingNames, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [uploading, setUploading] = useState(false)

  function reset() {
    setEntries([])
    setUploading(false)
  }

  function handleClose() {
    if (uploading) return
    reset()
    onClose()
  }

  function addFiles(fileList: FileList | File[]) {
    const newEntries: FileEntry[] = []
    Array.from(fileList).forEach(f => {
      if (!ACCEPTED_TYPES.has(f.type)) return
      newEntries.push({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        name: getBaseName(f.name),
        nameError: '',
        progress: 0,
        status: 'idle',
        errorMsg: '',
      })
    })
    setEntries(prev => [...prev, ...newEntries])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function updateName(id: string, name: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, name, nameError: '' } : e))
  }

  function validateAll(currentEntries: FileEntry[], currentExisting: string[]): FileEntry[] {
    // track names used within this batch to catch intra-batch duplicates
    const seen = new Set<string>()
    return currentEntries.map(entry => {
      const trimmed = entry.name.trim()
      const ext = getExtension(entry.file.name)
      const full = (trimmed + ext).toLowerCase()
      let nameError = ''
      if (!trimmed) {
        nameError = 'Name cannot be empty.'
      } else if (currentExisting.some(n => n.toLowerCase() === full)) {
        nameError = 'Already exists in this folder.'
      } else if (seen.has(full)) {
        nameError = 'Duplicate name in this batch.'
      }
      seen.add(full)
      return { ...entry, nameError }
    })
  }

  async function handleUploadAll() {
    const validated = validateAll(entries, existingNames)
    setEntries(validated)
    if (validated.some(e => e.nameError)) return

    setUploading(true)

    await Promise.all(
      validated.map(async entry => {
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'uploading', progress: 0 } : e))
        try {
          const url = await uploadToCloudinary(entry.file, pct => {
            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, progress: pct } : e))
          })
          const ext = getExtension(entry.file.name)
          const { data, error } = await supabase
            .from('files')
            .insert({
              folder_id: folderId,
              name: entry.name.trim(),
              original_name: entry.file.name,
              file_url: url,
              mime_type: entry.file.type,
              size: entry.file.size,
            })
            .select('id, name, original_name, file_url, mime_type, size, created_at')
            .single()

          if (error || !data) throw new Error(error?.message ?? 'DB insert failed')
          onUploaded(data as FileItem)
          setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'done', progress: 100 } : e))
        } catch (err: unknown) {
          setEntries(prev => prev.map(e =>
            e.id === entry.id
              ? { ...e, status: 'error', errorMsg: err instanceof Error ? err.message : 'Upload failed' }
              : e
          ))
        }
      })
    )

    setUploading(false)
  }

  const allDone = entries.length > 0 && entries.every(e => e.status === 'done')
  const hasIdle = entries.some(e => e.status === 'idle')
  const hasError = entries.some(e => e.status === 'error')

  return (
    <Dialog open={open} onClose={handleClose} title="Upload files">
      <div className="flex flex-col gap-4">

        {/* Supported types */}
        <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
          Supported: <span style={{ color: 'var(--fg-secondary)' }}>{SUPPORTED_LABEL}</span>
        </p>

        {/* Drop zone */}
        {!allDone && (
          <div
            className="rounded-xl flex flex-col items-center justify-center gap-2 py-7 cursor-pointer transition-all duration-200"
            style={{ border: '1.5px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(55,202,55,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            <Upload size={18} style={{ color: 'var(--fg-muted)' }} />
            <p className="text-sm text-center" style={{ color: 'var(--fg-muted)' }}>
              Drop files here or <span style={{ color: 'var(--brand-green-400)' }}>browse</span>
            </p>
            <input ref={inputRef} type="file" accept={ACCEPT_ATTR} multiple className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {/* File list */}
        {entries.length > 0 && (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {entries.map(entry => {
              const ext = getExtension(entry.file.name)
              return (
                <div
                  key={entry.id}
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {/* Row 1: icon + name input + remove */}
                  <div className="flex items-center gap-2">
                    <FileTypeIcon mime={entry.file.type} />
                    <div className="flex items-center flex-1 min-w-0">
                      <input
                        type="text"
                        value={entry.name}
                        onChange={e => updateName(entry.id, e.target.value)}
                        disabled={entry.status !== 'idle'}
                        className="flex-1 h-8 px-2.5 rounded-l-lg text-xs outline-none transition-all duration-150"
                        style={{
                          background: 'var(--bg-surface)',
                          color: 'var(--fg-primary)',
                          border: entry.nameError ? '1px solid rgba(209,85,74,0.6)' : '1px solid var(--border-default)',
                          borderRight: 'none',
                          minWidth: 0,
                        }}
                        onFocus={e => { if (!entry.nameError) e.currentTarget.style.borderColor = 'var(--brand-green)' }}
                        onBlur={e => { if (!entry.nameError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
                      />
                      <span
                        className="h-8 px-2 flex items-center text-xs rounded-r-lg shrink-0"
                        style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-default)', color: 'var(--fg-muted)' }}
                      >
                        {ext}
                      </span>
                    </div>
                    {entry.status === 'idle' && (
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md shrink-0 transition-colors duration-150"
                        style={{ color: 'var(--fg-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg-muted)' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                    {entry.status === 'done' && <CheckCircle size={15} style={{ color: 'var(--brand-green-400)', flexShrink: 0 }} />}
                    {entry.status === 'error' && <AlertCircle size={15} style={{ color: 'rgb(209,85,74)', flexShrink: 0 }} />}
                  </div>

                  {/* Name error */}
                  {entry.nameError && (
                    <p className="text-xs" style={{ color: 'rgb(209,85,74)' }}>{entry.nameError}</p>
                  )}

                  {/* Progress bar */}
                  {(entry.status === 'uploading' || entry.status === 'done') && (
                    <div>
                      <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--fg-muted)' }}>
                        <span>{entry.status === 'done' ? 'Done' : 'Uploading...'}</span>
                        <span>{entry.progress}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{ width: `${entry.progress}%`, background: 'var(--gradient-green)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload error message */}
                  {entry.status === 'error' && (
                    <p className="text-xs" style={{ color: 'rgb(209,85,74)' }}>{entry.errorMsg}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pt-1">
          {allDone ? (
            <>
              <Button variant="ghost" size="sm" onClick={reset}>Upload more</Button>
              <Button variant="primary" size="sm" onClick={handleClose}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={entries.length === 0 || uploading || !hasIdle}
                onClick={handleUploadAll}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-transparent animate-spin"
                      style={{ borderTopColor: 'var(--fg-on-brand)', borderRightColor: 'var(--fg-on-brand)' }} />
                    Uploading...
                  </span>
                ) : `Upload${entries.length > 1 ? ` ${entries.length} files` : ''}`}
              </Button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  )
}
