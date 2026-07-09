'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function loginOrRegister(email: string, password: string): Promise<{ error?: string }> {
  // Admin client — can list users to check existence
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if user exists
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
  if (listError) return { error: 'Something went wrong. Please try again.' }

  const exists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  if (exists) {
    // User exists — sign in only, wrong password = clear error
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'Incorrect password. Please try again.' }
    return {}
  } else {
    // New user — sign up then sign in
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) return { error: signUpError.message }
    // Sign in immediately after signup
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { error: signInError.message }
    return {}
  }
}
