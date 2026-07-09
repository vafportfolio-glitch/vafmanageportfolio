'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginOrRegister } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Mode = 'main' | 'reset'

export default function TeamLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('main')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordShort = password.length > 0 && password.length < 8

  function enterResetMode() {
    setMode('reset')
    setError('')
    setInfo('')
    setPassword('')
  }

  function enterMainMode() {
    setMode('main')
    setError('')
    setInfo('')
  }

  async function handleMain(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Must be at least 8 characters.'); return }

    setLoading(true)
    const { error } = await loginOrRegister(email, password)
    setLoading(false)

    if (error) { setError(error); return }
    router.push('/team-portal')
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setInfo('If an account exists for this email, a reset link has been sent.')
  }

  const eyeButton = (
    <button
      type="button"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      onClick={() => setShowPassword(v => !v)}
      className="flex items-center justify-center w-full h-full rounded text-fg-muted hover:text-fg-primary active:scale-[0.92] transition-[color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
    >
      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )

  return (
    /*
     * min-h-[100dvh] per skill §3.E — prevents iOS Safari address-bar
     * layout jump that h-screen / min-h-screen causes.
     */
    <div
      className="min-h-[100dvh] flex items-center justify-center px-5"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Depth layers — give backdrop-filter something to blur against */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(55,202,55,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(24,139,246,0.06) 0%, transparent 70%)' }}
      />

      {/*
       * Entry animation gated behind motion-safe: — respects prefers-reduced-motion
       * via Tailwind's motion-safe: variant (maps to @media (prefers-reduced-motion: no-preference))
       */}
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 w-full max-w-[400px]">

        {/*
         * Glassmorphism card — web approximation per skill §5 and Appendix C.
         * prefers-reduced-transparency fallback: solid opaque surface, no blur.
         * Labeled as approximation; not an Apple-issued API.
         */}
        <div
          className="rounded-2xl px-8 pt-10 pb-8 supports-[backdrop-filter]:backdrop-blur-[20px]"
          style={{
            /* Glass surface — semi-transparent with blur */
            background: 'rgba(18, 22, 20, 0.60)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(55, 202, 55, 0.13)',
            /* Inner top highlight for edge refraction (skill §5 glassmorphism note) */
            boxShadow: '0 8px 40px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Icon + wordmark — gradient used here and nowhere else on the page */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(55,202,55,0.08)',
                boxShadow: '0 0 0 1px var(--brand-green-700), 0 4px 16px -4px rgba(55,202,55,0.2)',
              }}
            >
              <ShieldCheck size={22} strokeWidth={1.75} style={{ color: 'var(--brand-green)' }} />
            </div>
            <div className="text-center">
              <h1
                className="text-[1.75rem] font-semibold tracking-[-0.02em] leading-none"
                style={{
                  background: 'var(--gradient-brand)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Team Portal
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
                {mode === 'reset' ? 'Enter your email to receive a reset link' : 'Sign in or create your account'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-7" style={{ height: '1px', background: 'rgba(55,202,55,0.08)' }} />

          {/* Form */}
          {mode === 'main' ? (
            <form onSubmit={handleMain} className="flex flex-col gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={14} />}
              />

              <div className="flex flex-col gap-2">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock size={14} />}
                  trailingAction={eyeButton}
                  error={passwordShort ? 'Must be at least 8 characters.' : undefined}
                />
                <div className="flex items-center justify-between px-0.5">
                  <span
                    className="text-xs transition-colors duration-150"
                    style={{ color: passwordShort ? 'transparent' : 'var(--fg-muted)' }}
                  >
                    Must be at least 8 characters
                  </span>
                  <button
                    type="button"
                    onClick={enterResetMode}
                    className="text-xs underline underline-offset-2 hover:opacity-70 active:scale-[0.97] transition-[opacity,transform] duration-150"
                    style={{ color: 'var(--brand-green)' }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm -mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
              )}

              <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full mt-1">
                {loading ? (
                  <>
                    {/*
                     * Spinner gated behind motion-safe: per skill §6.B.
                     * Reduced-motion users see a static dash instead of a spinning icon.
                     */}
                    <Loader2
                      size={15}
                      className="shrink-0 motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                    <span>Signing in</span>
                  </>
                ) : 'Continue'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={14} />}
              />

              {error && (
                <p className="text-sm -mt-1" style={{ color: 'var(--color-danger)' }}>{error}</p>
              )}
              {info && (
                <p className="text-sm -mt-1 leading-relaxed" style={{ color: 'var(--color-success)' }}>{info}</p>
              )}

              <Button type="submit" variant="primary" size="lg" disabled={loading || !!info} className="w-full">
                {loading ? (
                  <>
                    <Loader2 size={15} className="shrink-0 motion-safe:animate-spin" aria-hidden="true" />
                    <span>Sending</span>
                  </>
                ) : 'Send reset link'}
              </Button>

              <button
                type="button"
                onClick={enterMainMode}
                className="text-sm text-center hover:opacity-70 active:scale-[0.97] transition-[opacity,transform] duration-150"
                style={{ color: 'var(--fg-muted)' }}
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
