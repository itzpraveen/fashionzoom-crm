import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { DashboardTiles } from '@/components/DashboardTiles'
export const dynamic = 'force-dynamic'

export default async function PerformancePage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today</h2>
      <DashboardTiles />
    </div>
  )
}
 
