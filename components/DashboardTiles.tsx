"use client"
import { useEffect, useMemo, useState, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Phone, TrendingUp, Bell, UserPlus } from 'lucide-react'

type Tile = { label: string; value: number }

/**
 * Dashboard metrics display with real-time updates and improved visuals
 */
export function DashboardTiles() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const [tiles, setTiles] = useState<Tile[] | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const today = new Date(); today.setHours(0,0,0,0)
      // Use lightweight HEAD count queries for speed
      const [totalCalls, contactCalls, overdue, created] = await Promise.all([
        supabase.from('activities').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('activities').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()).eq('outcome', 'CONNECTED'),
        supabase.from('followups').select('*', { count: 'exact', head: true }).lt('due_at', new Date().toISOString()).eq('status', 'PENDING'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      ])
      if (!mounted) return
      const total = totalCalls.count || 0
      const connected = contactCalls.count || 0
      setTiles([
        { label: "Today's Calls", value: total },
        { label: 'Contact Rate', value: total ? Math.round((connected / total) * 100) : 0 },
        { label: 'Overdue Follow-ups', value: overdue.count || 0 },
        { label: 'Leads Created', value: created.count || 0 }
      ])
    }
    load()

    // Debounce realtime updates to avoid rapid re-renders
    const timer = { ref: null as any }
    const schedule = () => {
      if (timer.ref) clearTimeout(timer.ref)
      timer.ref = setTimeout(load, 500)
    }
    const ch = supabase
      .channel('realtime:dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, schedule)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'followups' }, schedule)
      .subscribe()
    return () => {
      mounted = false
      try { ch.unsubscribe() } catch {}
      supabase.removeChannel(ch)
      if (timer.ref) clearTimeout(timer.ref)
    }
  }, [supabase])

  const TileIcon = ({ label }: { label: string }) => {
    const base = 'w-5 h-5'
    if (label === "Today's Calls") return <Phone className={base} aria-hidden="true" />
    if (label === 'Contact Rate') return <TrendingUp className={base} aria-hidden="true" />
    if (label === 'Overdue Follow-ups') return <Bell className={base} aria-hidden="true" />
    return <UserPlus className={base} aria-hidden="true" />
  }

  const accentFor = (label: string) => {
    if (label === 'Overdue Follow-ups') return 'ring-danger/25 bg-danger/5'
    if (label === 'Contact Rate') return 'ring-warning/25 bg-warning/5'
    if (label === "Today's Calls") return 'ring-primary/25 bg-primary/5'
    return 'ring-success/25 bg-success/5'
  }

  const content = (t: Tile) => (
    <>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className={`inline-flex items-center justify-center rounded-md ${accentFor(t.label)} ring-1 ring-inset p-1.5`} aria-hidden="true">
          <TileIcon label={t.label} />
        </span>
        <span>{t.label}</span>
      </div>
      <div className="text-2xl font-semibold" title={t.label === 'Contact Rate' ? `${t.value}%` : undefined}>
        {t.label === 'Contact Rate' ? `${t.value}%` : t.value}
      </div>
    </>
  )

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      aria-live="polite"
      aria-busy={tiles === null}
    >
      {tiles === null ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 md:p-5 animate-pulse">
            <div className="h-4 w-24 bg-black/10 dark:bg-white/10 rounded mb-3" />
            <div className="h-7 w-12 bg-black/10 dark:bg-white/10 rounded" />
          </div>
        ))
      ) : (
        tiles.map(t => {
          let href: string | null = null
          switch (t.label) {
            case "Today's Calls":
            case 'Contact Rate':
              href = '/dashboard/performance'
              break
            case 'Overdue Follow-ups':
              href = '/dashboard/queue?due=today'
              break
            case 'Leads Created':
              href = '/leads'
              break
          }
          return href ? (
            <Link
              key={t.label}
              href={href}
              className="card p-4 md:p-5 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              aria-label={`Open ${t.label}`}
              prefetch={false}
            >
              {content(t)}
            </Link>
          ) : (
            <div key={t.label} className="card p-4 md:p-5">
              {content(t)}
            </div>
          )
        })
      )}
    </div>
  )
}
