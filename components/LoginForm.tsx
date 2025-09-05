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
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` } })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
      {sent && <p aria-live="polite" className="text-success text-sm">Check your inbox and click the link to continue.</p>}
    </form>
  )
}
