"use client"
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const urlError = params.get('error') || params.get('error_description')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [params])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const supabase = createBrowserClient()
    const redirect = params.get('redirect') || '/dashboard'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        shouldCreateUser: false,
      }
    })
    if (error) {
      const msg = (error.message || '').toLowerCase()
      if (msg.includes('signups not allowed') || msg.includes('not allowed')) {
        setError('Sign‑ups are disabled. Ask an admin to invite you.')
      } else if (msg.includes('user not found') || msg.includes('no user found')) {
        setError('This email is not registered. Ask an admin to invite you.')
      } else {
        setError(error.message)
      }
    }
    else setSent(true)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-xs text-muted">Access is invite‑only. Only emails invited by an admin can sign in.</p>
      <label className="block text-sm">Work email</label>
      <input
        type="email"
        required
        className="form-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
        placeholder="you@company.com"
      />
      <button type="submit" className="touch-target w-full btn-primary font-medium">Send magic link</button>
      {error && <p role="alert" aria-live="polite" className="text-danger text-sm">{error}</p>}
      {sent && (
        <div className="space-y-1">
          <p aria-live="polite" className="text-success text-sm">If your email is registered, you’ll receive a sign‑in link.</p>
          <p className="text-xs text-muted">Didn’t get it? Check spam or contact your admin for an invite.</p>
        </div>
      )}
    </form>
  )
}
