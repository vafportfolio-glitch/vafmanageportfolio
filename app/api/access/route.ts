import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedDownloader } from '@/lib/downloadAccess'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!(await isAuthorizedDownloader(supabase, user.id))) {
    return new Response('You do not have permission to manage access.', { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const targetUserId = body?.userId
  const allow = body?.allow
  if (typeof targetUserId !== 'string' || typeof allow !== 'boolean') {
    return new Response('Invalid request', { status: 400 })
  }

  if (targetUserId === user.id) {
    return new Response('You cannot change your own access.', { status: 400 })
  }

  if (allow) {
    const { error } = await supabase
      .from('download_access')
      .upsert({ user_id: targetUserId })
    if (error) return new Response(error.message, { status: 500 })
  } else {
    const { count } = await supabase
      .from('download_access')
      .select('user_id', { count: 'exact', head: true })
    if ((count ?? 0) <= 1) {
      return new Response('At least one authorized email is required — add another before removing this one.', { status: 400 })
    }
    const { error } = await supabase
      .from('download_access')
      .delete()
      .eq('user_id', targetUserId)
    if (error) return new Response(error.message, { status: 500 })
  }

  return Response.json({ ok: true })
}
