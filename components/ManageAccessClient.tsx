'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, ShieldCheck, Lock, Search } from 'lucide-react'
import { Toast } from '@/components/Toast'
import { Dialog } from '@/components/Dialog'
import { Button } from '@/components/ui/Button'
import { ActivityTab, type ActivityItem } from '@/components/ActivityTab'

interface Profile {
  id: string
  email: string
}

export function ManageAccessClient({
  profiles,
  initialAuthorizedIds,
  currentUserId,
  activityItems,
  loadError,
}: {
  profiles: Profile[]
  initialAuthorizedIds: string[]
  currentUserId: string
  activityItems: ActivityItem[]
  loadError?: string | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'access' | 'activity'>('access')
  const [authorizedIds, setAuthorizedIds] = useState(new Set(initialAuthorizedIds))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{ profile: Profile; allow: boolean } | null>(null)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [search, setSearch] = useState('')

  const filteredProfiles = profiles.filter(p =>
    p.email.toLowerCase().includes(search.trim().toLowerCase())
  )

  function requestToggle(profile: Profile, allow: boolean) {
    if (profile.id === currentUserId) return // can't change your own access
    setConfirmTarget({ profile, allow })
  }

  async function confirmToggle() {
    if (!confirmTarget) return
    const { profile, allow } = confirmTarget
    setConfirmTarget(null)
    setPendingId(profile.id)
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, allow }),
      })
      if (!res.ok) {
        const message = await res.text()
        setToast({ visible: true, message: message || 'Could not update access.' })
        return
      }
      setAuthorizedIds(prev => {
        const next = new Set(prev)
        if (allow) next.add(profile.id)
        else next.delete(profile.id)
        return next
      })
      setToast({ visible: true, message: allow ? 'Download access granted.' : 'Download access removed.' })
    } catch {
      setToast({ visible: true, message: 'Network error — please try again.' })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="w-full mx-auto px-6 pt-16 pb-24" style={{ maxWidth: '800px' }}>
      <button
        onClick={() => router.push('/team-portal')}
        className="h-9 rounded-xl flex items-center gap-1.5 px-3 mb-8 transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--fg-secondary)' }}
      >
        <ChevronLeft size={15} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck size={22} style={{ color: 'var(--brand-green-400)' }} />
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--fg-primary)' }}>Manage download access</h1>
      </div>
      <p className="text-sm mb-6 max-w-md" style={{ color: 'var(--fg-muted)' }}>
        Everyone can view files. Only checked emails below can actually download them —
        and only checked emails can change this list.
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['access', 'activity'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: tab === t ? 'var(--gradient-green)' : 'transparent',
              color: tab === t ? 'var(--fg-on-brand)' : 'var(--fg-secondary)',
            }}
          >
            {t === 'access' ? 'Access' : 'Activity'}
          </button>
        ))}
      </div>

      {tab === 'access' ? (
        <>
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--fg-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by email..."
              className="w-full h-10 pl-10 pr-3.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--fg-primary)',
                border: '1px solid var(--border-default)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand-green)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
            />
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(18, 22, 20, 0.5)' }}
          >
            <div className="manage-access-scroll max-h-[420px] overflow-y-auto">
            {loadError ? (
              <p className="text-sm px-5 py-6" style={{ color: 'rgb(209,85,74)' }}>{loadError}</p>
            ) : filteredProfiles.length === 0 && (
              <p className="text-sm px-5 py-6" style={{ color: 'var(--fg-muted)' }}>
                {profiles.length === 0 ? 'No team members yet.' : 'No matches.'}
              </p>
            )}
            {filteredProfiles.map((p, i) => {
              const allowed = authorizedIds.has(p.id)
              const busy = pendingId === p.id
              const isSelf = p.id === currentUserId
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--fg-primary)' }}>
                      {p.email}
                      {isSelf && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--fg-muted)' }}>(you)</span>
                      )}
                    </p>
                  </div>
                  <button
                    disabled={busy || isSelf}
                    onClick={() => requestToggle(p, !allowed)}
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 disabled:opacity-40"
                    style={{
                      background: allowed ? 'var(--gradient-green)' : 'rgba(255,255,255,0.06)',
                      border: allowed ? 'none' : '1px solid rgba(255,255,255,0.15)',
                      cursor: isSelf ? 'not-allowed' : 'pointer',
                    }}
                    title={isSelf ? "You can't change your own access" : undefined}
                    aria-label={allowed ? 'Revoke download access' : 'Grant download access'}
                  >
                    {isSelf ? (
                      <Lock size={11} style={{ color: 'var(--fg-muted)' }} />
                    ) : (
                      allowed && <Check size={14} style={{ color: 'var(--fg-on-brand)' }} />
                    )}
                  </button>
                </div>
              )
            })}
            </div>
          </div>
        </>
      ) : (
        <ActivityTab items={activityItems} profiles={profiles} />
      )}

      {/* Confirm dialog */}
      <Dialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.allow ? 'Grant download access?' : 'Revoke download access?'}
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-secondary)' }}>
            {confirmTarget?.allow ? (
              <>
                <strong style={{ color: 'var(--fg-primary)' }}>{confirmTarget.profile.email}</strong> will
                be able to download files and manage this access list.
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--fg-primary)' }}>{confirmTarget?.profile.email}</strong> will
                lose the ability to download files and manage this access list.
              </>
            )}
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmTarget?.allow ? 'primary' : 'danger'}
              size="sm"
              onClick={confirmToggle}
            >
              {confirmTarget?.allow ? 'Grant access' : 'Revoke access'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '' })}
      />

      <style>{`
        .manage-access-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .manage-access-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .manage-access-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
        }
        .manage-access-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.22);
        }
        .manage-access-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
        }
      `}</style>
    </div>
  )
}
