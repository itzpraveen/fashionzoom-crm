"use client"
import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NotificationsBell() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [open, setOpen] = useState(false)
  const [counts, setCounts] = useState({ overdue: 0, today: 0 })

  useEffect(() => {
    let mounted = true
    async function load() {
      const now = new Date()
      const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
      const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999)
      const [{ count: overdue }, { count: today }] = await Promise.all([
        supabase.from('followups').select('*', { count: 'exact', head: true }).lt('due_at', now.toISOString()).eq('status','PENDING'),
        supabase.from('followups').select('*', { count: 'exact', head: true }).gte('due_at', todayStart.toISOString()).lt('due_at', todayEnd.toISOString()).eq('status','PENDING'),
      ])
      if (mounted) setCounts({ overdue: overdue || 0, today: today || 0 })
    }
    load()
    const ch = supabase
      .channel('realtime:followups-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followups' }, load)
      .subscribe()
    return () => { mounted = false; try { ch.unsubscribe() } catch {}; supabase.removeChannel(ch) }
  }, [supabase])

  const total = (counts.overdue || 0) + (counts.today || 0)
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} aria-label="Notifications" className="relative rounded bg-white/10 px-3 py-2">
        <Bell size={16} />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-danger text-white text-[10px] px-[3px]">{Math.min(total, 99)}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-white/10 bg-surface shadow-xl p-2 z-50">
          <div className="text-sm font-medium mb-1">Notifications</div>
          <div className="text-sm flex items-center justify-between p-1 rounded hover:bg-white/10">
            <span>Overdue follow-ups</span>
            <span className="text-xs rounded-full px-2 py-0.5 border border-danger/30 bg-danger/10 text-danger">{counts.overdue}</span>
          </div>
          <div className="text-sm flex items-center justify-between p-1 rounded hover:bg-white/10">
            <span>Due today</span>
            <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{counts.today}</span>
          </div>
          <div className="border-t border-white/10 my-1" />
          <div className="flex gap-2 justify-end">
            <Link className="text-xs underline" href="/dashboard/queue?due=today" onClick={()=>setOpen(false)}>Open queue</Link>
            <Link className="text-xs underline" href="/leads?view=table" onClick={()=>setOpen(false)}>Leads</Link>
          </div>
        </div>
      )}
    </div>
  )
}

