import { DashboardTiles } from '@/components/DashboardTiles'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <DashboardTiles />
      <p className="text-sm text-muted">Live updates via Realtime.</p>
    </div>
  )
}
