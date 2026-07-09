import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalHeader } from '@/components/PortalHeader'

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

  return (
    <>
      <PortalHeader email={user.email} />
      {children}
    </>
  )
}
