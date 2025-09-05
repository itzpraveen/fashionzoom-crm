"use client"
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client-with-retry'

type Tile = { label: string; value: number }

/**
 * Dashboard metrics display component with real-time updates
 * 
 * Displays key performance indicators:
 * - Today's call count
 * - Contact rate percentage
 * - Overdue follow-ups count
 * - Leads created today
 * 
 * Features:
 * - Real-time updates via Supabase Realtime subscriptions
 * - Automatic refresh when new activities or follow-ups are created
 * - Responsive grid layout
 * - Loading states handled gracefully
 * 
 * @example
 * ```tsx
 * <DashboardTiles />
 * ```
 */
export function DashboardTiles() {
  const supabase = createBrowserClient()
  const [tiles, setTiles] = useState<Tile[]>([
    { label: "Today's Calls", value: 0 },
    { label: 'Contact Rate', value: 0 },
    { label: 'Overdue Follow-ups', value: 0 },
    { label: 'Leads Created', value: 0 },
  ])

  useEffect(() => {
    let mounted = true
    async function load() {
      const today = new Date(); today.setHours(0,0,0,0)
      const { data: calls } = await supabase.from('activities').select('id, outcome').gte('created_at', today.toISOString())
      const contact = calls?.filter(c => c.outcome === 'CONNECTED').length ?? 0
      const { count: overdue } = await supabase.from('followups').select('*', { count: 'exact', head: true }).lt('due_at', new Date().toISOString()).eq('status','PENDING')
      const { count: created } = await supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
      if (mounted) setTiles([
        { label: "Today's Calls", value: calls?.length ?? 0 },
        { label: 'Contact Rate', value: calls && calls.length ? Math.round((contact / calls.length) * 100) : 0 },
        { label: 'Overdue Follow-ups', value: overdue ?? 0 },
        { label: 'Leads Created', value: created ?? 0 }
      ])
    }
    load()
    const sub1 = supabase.channel('realtime:activities').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, load).subscribe()
    const sub2 = supabase.channel('realtime:followups').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'followups' }, load).subscribe()
    return () => { mounted = false; supabase.removeChannel(sub1); supabase.removeChannel(sub2) }
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="rounded border border-white/10 p-3">
          <div className="text-xs text-muted">{t.label}</div>
          <div className="text-2xl font-semibold">{t.value}</div>
        </div>
      ))}
    </div>
  )
}

