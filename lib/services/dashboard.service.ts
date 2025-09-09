import { createServerSupabase } from '@/lib/supabase/server'

export type DashboardMetrics = {
  totalCalls: number
  contactRate: number
  overdue: number
  leadsCreated: number
}

// Lightweight counts used for the dashboard tiles
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createServerSupabase()
  const today = new Date(); today.setHours(0,0,0,0)
  const nowIso = new Date().toISOString()

  const [totalCallsRes, connectedCallsRes, overdueRes, createdRes] = await Promise.all([
    supabase.from('activities').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('activities').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()).eq('outcome', 'CONNECTED'),
    supabase.from('followups').select('*', { count: 'exact', head: true }).lt('due_at', nowIso).eq('status', 'PENDING'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
  ])

  const total = totalCallsRes.count || 0
  const connected = connectedCallsRes.count || 0
  const overdue = overdueRes.count || 0
  const leadsCreated = createdRes.count || 0

  return {
    totalCalls: total,
    contactRate: total ? Math.round((connected / total) * 100) : 0,
    overdue,
    leadsCreated,
  }
}

// Count of overdue follow-ups for a specific user (used in dashboard tabs badge)
export async function getUserOverdueCount(userId: string): Promise<number> {
  const supabase = createServerSupabase()
  const now = new Date().toISOString()
  const { count } = await supabase
    .from('followups')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'PENDING')
    .lt('due_at', now)
  return count || 0
}

