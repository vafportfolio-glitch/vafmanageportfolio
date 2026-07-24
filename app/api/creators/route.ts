import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedDownloader } from '@/lib/downloadAccess'

// "email before the @" — never the full address, per the masking rule
// agreed for this feature.
function maskEmail(email: string) {
  return email.split('@')[0]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!(await isAuthorizedDownloader(supabase, user.id))) {
    return new Response('You do not have permission to view this.', { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const folderIds: string[] = Array.isArray(body?.folderIds) ? body.folderIds : []
  const fileIds: string[] = Array.isArray(body?.fileIds) ? body.fileIds : []

  const [{ data: folderRows }, { data: fileRows }] = await Promise.all([
    folderIds.length
      ? supabase.from('folders').select('id, created_by').in('id', folderIds)
      : Promise.resolve({ data: [] as { id: string; created_by: string | null }[] }),
    fileIds.length
      ? supabase.from('files').select('id, uploaded_by').in('id', fileIds)
      : Promise.resolve({ data: [] as { id: string; uploaded_by: string | null }[] }),
  ])

  const creatorIds = Array.from(new Set([
    ...(folderRows ?? []).map(r => r.created_by).filter((v): v is string => !!v),
    ...(fileRows ?? []).map(r => r.uploaded_by).filter((v): v is string => !!v),
  ]))

  const emailById = new Map<string, string>()
  if (creatorIds.length) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', creatorIds)
    for (const p of profileRows ?? []) emailById.set(p.id, p.email)
  }

  const folders: Record<string, string> = {}
  for (const r of folderRows ?? []) {
    if (r.created_by && emailById.has(r.created_by)) {
      folders[r.id] = maskEmail(emailById.get(r.created_by)!)
    }
  }

  const files: Record<string, string> = {}
  for (const r of fileRows ?? []) {
    if (r.uploaded_by && emailById.has(r.uploaded_by)) {
      files[r.id] = maskEmail(emailById.get(r.uploaded_by)!)
    }
  }

  return Response.json({ folders, files })
}
