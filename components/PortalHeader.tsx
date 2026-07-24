'use client'

import { useRouter } from 'next/navigation'
import { LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function PortalHeader({ email, canManageAccess }: { email: string; canManageAccess: boolean }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/team-login')
  }

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-end gap-4 px-6 py-3"
      style={{
        background: 'rgba(10, 13, 12, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--fg-secondary)' }}>
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: 'var(--brand-green)', boxShadow: '0 0 6px rgba(55,202,55,0.5)' }}
        />
        <span>
          Logged in as <strong style={{ color: 'var(--fg-primary)' }}>{email}</strong>
        </span>
      </div>
      {canManageAccess && (
        <Button variant="outline" size="sm" onClick={() => router.push('/team-portal/manage-access')}>
          <ShieldCheck size={14} />
          Manage access
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut size={14} />
        Log out
      </Button>
    </header>
  )
}
