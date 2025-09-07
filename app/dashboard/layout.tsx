import type { ReactNode } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardTabs from '@/components/DashboardTabs'
import StickyHeader from '@/components/StickyHeader'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <StickyHeader className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-gradient-to-b from-white/40 to-transparent dark:from-black/20 backdrop-blur supports-[backdrop-filter]:bg-transparent">
        <DashboardTabs />
      </StickyHeader>
      <div className="pt-3">{children}</div>
    </div>
  )
}
