import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalHeader } from '@/components/PortalHeader'
import { ViewerEmailProvider } from '@/lib/ViewerEmailContext'
import { isAuthorizedDownloader } from '@/lib/downloadAccess'

export default async function TeamPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/team-login')
  }

  const canDownload = await isAuthorizedDownloader(supabase, user.id)

  return (
    <ViewerEmailProvider userId={user.id} email={user.email} canDownload={canDownload}>
      <PortalHeader email={user.email} canManageAccess={canDownload} />
      {children}
    </ViewerEmailProvider>
  )
}
