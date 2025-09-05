import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import LoginForm from '@/components/LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return <LoginForm />
}
