import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AuthStatusPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    role = (profile?.role as any) || null
  }
  return (
    <pre className="text-xs p-4 rounded bg-white/5 border border-white/10 overflow-auto">
{JSON.stringify({
  server: {
    user: user ? { id: user.id, email: user.email } : null,
    role
  }
}, null, 2)}
    </pre>
  )
}

