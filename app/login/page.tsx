"use client"
import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/onboarding` } })
    if (error) setError(error.message)
    else setSent(true)
  }

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
        <button type="submit" className="touch-target w-full rounded bg-primary text-black font-medium px-4 py-2">Send link</button>
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        {sent && <p className="text-success text-sm">Check your inbox for the magic link.</p>}
      </form>
      <p className="mt-6 text-sm">After login, add to home screen for faster access.</p>
    </div>
  )
}

