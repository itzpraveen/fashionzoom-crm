"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef } from 'react'

export function LeadsFilters({ status, search, due }: { status?: string; search?: string; due?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const buildUrl = useCallback((next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params?.toString())
    if (next.status !== undefined) {
      if (next.status) p.set('status', next.status)
      else p.delete('status')
    }
    if (next.search !== undefined) {
      if (next.search) p.set('search', next.search)
      else p.delete('search')
    }
    if (next.due !== undefined) {
      if (next.due) p.set('due', next.due)
      else p.delete('due')
    }
    p.set('page', '1')
    return `?${p.toString()}`
  }, [params])

  return (
    <div className="flex gap-2">
      <select
        className="form-input w-auto"
        onChange={(e) => {
          router.push(buildUrl({ status: e.target.value }))
        }}
        defaultValue={status || ''}
      >
        <option value="">All Status</option>
        <option value="NEW">New</option>
        <option value="CONTACTED">Contacted</option>
        <option value="FOLLOW_UP">Follow Up</option>
        <option value="QUALIFIED">Qualified</option>
        <option value="CONVERTED">Converted</option>
        <option value="LOST">Lost</option>
        <option value="DNC">DNC</option>
      </select>
      <input
        type="search"
        placeholder="Search leads..."
        className="form-input w-48"
        defaultValue={search || ''}
        onChange={(e) => {
          const val = e.target.value
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            router.push(buildUrl({ search: val }))
          }, 500)
        }}
      />
      <label className="flex items-center gap-1 text-xs text-muted ml-2">
        <input
          type="checkbox"
          defaultChecked={due === 'today'}
          onChange={(e) => {
            router.push(buildUrl({ due: e.target.checked ? 'today' : undefined }))
          }}
        />
        Today
      </label>
    </div>
  )
}
