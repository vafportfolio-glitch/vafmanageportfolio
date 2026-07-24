import type { SupabaseClient } from '@supabase/supabase-js'

// Authorized-downloader status now lives in the `download_access` table
// (one row per auth.users id = allowed to download AND allowed to manage
// this list) instead of a hardcoded list. See /team-portal/manage-access.
export async function isAuthorizedDownloader(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('download_access')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
