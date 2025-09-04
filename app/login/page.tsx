"use client"
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [otp, setOtp] = useState('')

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const run = async () => {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.replace('/dashboard')
      // surface callback/onboarding errors if present
      const urlError = params.get('error') || params.get('error_description')
      if (urlError) setError(decodeURIComponent(urlError))
      setLoading(false)
    }
    run()
  }, [router, params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const supabase = createBrowserClient()
    const redirect = params.get('redirect') || '/dashboard'
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` } })
    if (error) setError(error.message)
    else setSent(true)
  }

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const supabase = createBrowserClient()
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error
      const redirect = params.get('redirect') || '/dashboard'
      router.replace(`/onboarding?redirect=${encodeURIComponent(redirect)}`)
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code')
    }
  }

  if (loading) return null
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <p className="text-muted mb-4">Sign in with your email. We send a magic link.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">Email</label>
        <input
          type="email"
          required
          className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />
        <button type="submit" className="touch-target w-full rounded bg-primary text-white font-medium px-4 py-2">Send link</button>
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        {sent && <p className="text-success text-sm">Check your inbox for the magic link.</p>}
      </form>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-sm text-muted mb-2">Have a 6‑digit code from the email?</p>
        <form onSubmit={onVerify} className="flex items-center gap-2">
          <input inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="123456" className="rounded bg-white/5 border border-white/10 px-3 py-2" value={otp} onChange={(e)=>setOtp(e.target.value)} aria-label="One-time code" />
          <button className="rounded bg-white/10 px-3 py-2">Verify</button>
        </form>
      </div>
      <p className="mt-6 text-sm">After login, add to home screen for faster access.</p>
    </div>
  )
}
