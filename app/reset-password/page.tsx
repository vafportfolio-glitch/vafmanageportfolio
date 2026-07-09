'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase fires an AUTH_CHANGE event with type PASSWORD_RECOVERY
  // when the user lands here via the reset link — wait for it before
  // allowing form submission
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const passwordShort = password.length > 0 && password.length < 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Must be at least 8 characters.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setError(error.message); return }

    setDone(true)
    setTimeout(() => router.push('/team-login'), 2500)
  }

  const eyeButton = (
    <button
      type="button"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      onClick={() => setShowPassword(v => !v)}
      className="flex items-center justify-center w-7 h-7 rounded text-fg-muted hover:text-fg-primary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
    >
      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--gradient-brand)' }}
          >
            <ShieldCheck size={22} color="var(--fg-on-brand)" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{
                background: 'var(--gradient-brand)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Team Portal
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--fg-muted)' }}>
              Choose a new password
            </p>
          </div>
        </div>

        <Card className="px-7 py-8">
          {done ? (
            <p className="text-sm text-center" style={{ color: 'var(--color-success)' }}>
              Password updated. Redirecting you to sign in…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {!sessionReady && (
                <p className="text-xs text-center" style={{ color: 'var(--fg-muted)' }}>
                  Verifying reset link…
                </p>
              )}

              <Input
                label="New password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={15} />}
                trailingAction={eyeButton}
                error={passwordShort ? 'Must be at least 8 characters.' : undefined}
              />
              {!passwordShort && (
                <span className="text-xs -mt-2" style={{ color: 'var(--fg-muted)' }}>
                  Must be at least 8 characters
                </span>
              )}

              {error && (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !sessionReady}
                className="w-full"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating…</>
                ) : 'Update password'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
