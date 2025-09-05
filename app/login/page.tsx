import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import LoginForm from '@/components/LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <picture className="inline-flex h-10 w-auto">
            <source srcSet="/brand/logo-dark.png" media="(prefers-color-scheme: dark)" />
            <img src="/brand/logo-light.png" alt="FashionZoom" className="h-10 w-auto" />
          </picture>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted">Sign in with your email — we’ll send a secure magic link.</p>
        </div>
        <LoginForm />
        <p className="text-xs text-muted text-center">By continuing you agree to our acceptable use. We never share your email.</p>
      </div>
    </div>
  )
}
