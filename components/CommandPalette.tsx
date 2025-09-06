"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

type Result = { id: string; full_name: string | null; primary_phone: string; city: string | null }

export default function CommandPalette() {
  const router = useRouter()
  const sb = useMemo(() => createBrowserClient(), [])
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const close = () => { setOpen(false); setQ(''); setResults([]); setHighlight(0) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true) }
      if (e.key === 'Escape') { setOpen(false) }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-cmdk', onOpen as any)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('open-cmdk', onOpen as any) }
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 10) }, [open])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const term = q.trim()
      if (!term) { setResults([]); return }
      const { data: { user } } = await sb.auth.getUser()
      const or = `full_name.ilike.%${term}%,primary_phone.ilike.%${term}%,city.ilike.%${term}%`
      const { data } = await sb
        .from('leads')
        .select('id, full_name, primary_phone, city')
        .eq('owner_id', user?.id || '')
        .or(or)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!cancelled) setResults((data as any) || [])
    }
    const t = setTimeout(run, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, sb])

  const choose = useCallback((kind: 'lead'|'action', payload: any) => {
    if (kind === 'lead') router.push(`/leads/${payload}`)
    if (kind === 'action') {
      const a = payload as string
      if (a === 'add') router.push('/leads#add-lead')
      else if (a === 'queue') router.push('/dashboard/queue')
      else if (a === 'leads') router.push('/leads?view=table')
      else if (a === 'import') router.push('/import')
      else if (a === 'overview') router.push('/dashboard/overview')
    }
    close()
  }, [router])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm p-3" onClick={close}>
      <div className="mx-auto max-w-xl rounded-lg border border-white/10 bg-surface shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-2 p-2 border-b border-white/10">
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search leads or type a command"
            className="w-full bg-transparent outline-none px-2 py-2" aria-label="Command search" />
          <kbd className="text-[10px] text-muted border border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto p-1">
          {/* Quick actions */}
          <div className="px-2 pt-2 pb-1 text-xs text-muted">Actions</div>
          {[
            { key: 'add', label: 'Add lead' },
            { key: 'queue', label: 'Open My Queue' },
            { key: 'leads', label: 'Go to Leads (Table)' },
            { key: 'overview', label: 'Open Dashboard Overview' },
            { key: 'import', label: 'Import leads' },
          ].map((a, i) => (
            <button key={a.key} onClick={()=>choose('action', a.key)}
              onMouseEnter={()=>setHighlight(i)}
              className={`w-full text-left px-3 py-2 rounded ${highlight===i?'bg-white/10':''}`}>{a.label}</button>
          ))}
          <div className="px-2 pt-3 pb-1 text-xs text-muted">Leads</div>
          {results.length === 0 && <div className="px-3 py-2 text-sm text-muted">No results</div>}
          {results.map((r, i) => (
            <button key={r.id} className="w-full text-left px-3 py-2 rounded hover:bg-white/10"
              onClick={()=>choose('lead', r.id)}>
              <div className="font-medium truncate">{r.full_name || '—'}</div>
              <div className="text-xs text-muted truncate">{r.primary_phone} {r.city ? `• ${r.city}` : ''}</div>
            </button>
          ))}
        </div>
        <div className="border-t border-white/10 p-2 text-[11px] text-muted flex items-center justify-between">
          <div>Navigate with ↑ ↓ • Enter to open</div>
          <div className="hidden sm:flex items-center gap-1"><kbd className="border border-white/10 rounded px-1">Ctrl</kbd>+<kbd className="border border-white/10 rounded px-1">K</kbd></div>
        </div>
      </div>
    </div>
  )
}

