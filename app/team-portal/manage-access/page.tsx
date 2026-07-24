import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedDownloader } from '@/lib/downloadAccess'
import { ManageAccessClient } from '@/components/ManageAccessClient'
import type { ActivityItem } from '@/components/ActivityTab'

function getExtension(name: string) {
  const i = name.lastIndexOf('.')
  return i !== -1 ? name.slice(i) : ''
}

// "email before the @" — never the full address, per the masking rule
// agreed for this feature.
function maskEmail(email: string) {
  return email.split('@')[0]
}

export default async function ManageAccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/team-login')

  const authorized = await isAuthorizedDownloader(supabase, user.id)
  if (!authorized) redirect('/team-portal')

  const [
    { data: profiles, error: profilesError },
    { data: access },
    { data: allFolders },
    { data: allFiles },
  ] = await Promise.all([
    supabase.from('profiles').select('id, email').order('email', { ascending: true }),
    supabase.from('download_access').select('user_id'),
    supabase.from('folders').select('id, name, parent_id, created_by, created_at'),
    supabase.from('files').select('id, name, original_name, folder_id, uploaded_by, created_at'),
  ])

  const authorizedIds = (access ?? []).map(a => a.user_id)
  const emailById = new Map((profiles ?? []).map(p => [p.id, p.email]))

  const activityItems: ActivityItem[] = [
    ...(allFolders ?? []).map(f => ({
      id: f.id,
      name: f.name,
      type: (f.parent_id ? 'subfolder' : 'folder') as ActivityItem['type'],
      createdAt: f.created_at,
      creatorId: f.created_by,
      creatorLabel: f.created_by && emailById.has(f.created_by) ? maskEmail(emailById.get(f.created_by)!) : null,
      linkFolderId: f.id,
    })),
    ...(allFiles ?? []).map(f => ({
      id: f.id,
      name: f.name + getExtension(f.original_name),
      type: 'file' as ActivityItem['type'],
      createdAt: f.created_at,
      creatorId: f.uploaded_by,
      creatorLabel: f.uploaded_by && emailById.has(f.uploaded_by) ? maskEmail(emailById.get(f.uploaded_by)!) : null,
      linkFolderId: f.folder_id,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <ManageAccessClient
      profiles={profiles ?? []}
      initialAuthorizedIds={authorizedIds}
      currentUserId={user.id}
      activityItems={activityItems}
      loadError={
        profilesError || !profiles || (profiles.length === 0 && authorizedIds.length > 0)
          ? "Couldn't load the team list — this usually means Row Level Security on public.profiles is blocking the read."
          : null
      }
    />
  )
}
