import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/EmptyState'
import { LeadCard } from '@/components/LeadCard'
import { Skeleton } from '@/components/Skeleton'
import { AddLeadButton } from '@/components/AddLeadButton'
import { Pagination } from '@/components/Pagination'
import { redirect } from 'next/navigation'
import { LeadsFilters } from '@/components/LeadsFilters'
import LeadsTable, { LeadRow } from '@/components/LeadsTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; search?: string; due?: string; event_id?: string; program_id?: string }
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const page = Number(searchParams.page) || 1
  const offset = (page - 1) * PAGE_SIZE
  const role = (profile?.role ?? 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'
  const view = (searchParams as any).view || (role !== 'TELECALLER' ? 'table' : 'cards')
  
  // Optional: filter by event/program via enrollments
  let leadIdsFilter: string[] = []
  if (searchParams.event_id || searchParams.program_id) {
    let enrollQuery = supabase
      .from('lead_enrollments')
      .select('lead_id')
    if (searchParams.event_id) enrollQuery = enrollQuery.eq('event_id', searchParams.event_id)
    if (searchParams.program_id) enrollQuery = enrollQuery.eq('program_id', searchParams.program_id)
    const { data: enrolls } = await enrollQuery.limit(1000)
    leadIdsFilter = (enrolls || []).map((r: any) => r.lead_id)
    if (leadIdsFilter.length === 0) {
      return <EmptyState title="No leads found" hint="No leads match the selected event/program" />
    }
  }

  // Base leads query (avoid heavy nested ordering by default)
  let query = supabase
    .from('leads')
    .select(`
      id, full_name, primary_phone, city, source, status, score, next_follow_up_at, created_at, last_activity_at, notes,
      owner:profiles(full_name)
    `, { count: 'exact' })
    .eq('owner_id', user.id)
    .eq('is_deleted', false)
    .range(offset, offset + PAGE_SIZE - 1)
  
  if (leadIdsFilter.length > 0) {
    query = query.in('id', leadIdsFilter)
  }
  
  // Apply filters
  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }
  
  if (searchParams.search) {
    query = query.or(`full_name.ilike.%${searchParams.search}%,primary_phone.ilike.%${searchParams.search}%,city.ilike.%${searchParams.search}%`)
  }
  
  // Sort by priority: overdue first, then due soon, then new
  const now = new Date().toISOString()
  // Optional: today filter
  if (searchParams.due === 'today') {
    const start = new Date(); start.setHours(0,0,0,0)
    const end = new Date(); end.setHours(23,59,59,999)
    query = query.gte('next_follow_up_at', start.toISOString()).lt('next_follow_up_at', end.toISOString())
  }
  query = query.order('next_follow_up_at', { ascending: true, nullsFirst: false })
  
  const { data: baseLeads, count, error } = await query
  
  if (error) {
    console.error('Error fetching leads:', error)
    return <EmptyState title="Error loading leads" hint="Please try refreshing the page" />
  }
  
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  // Optionally enrich with latest activity/followup for table view only
  let leads: LeadRow[] = (baseLeads as any) || []
  if (view === 'table' && Array.isArray(baseLeads) && baseLeads.length > 0) {
    const ids = (baseLeads as any[]).map((l: any) => l.id)
    const [actsRes, flsRes] = await Promise.all([
      supabase.from('activities').select('lead_id,outcome,type,message,created_at').in('lead_id', ids).order('created_at', { ascending: false }),
      supabase.from('followups').select('lead_id,remark,created_at').in('lead_id', ids).order('created_at', { ascending: false })
    ])
    const latestAct = new Map<string, any>()
    actsRes.data?.forEach((a: any) => { if (!latestAct.has(a.lead_id)) latestAct.set(a.lead_id, a) })
    const latestF = new Map<string, any>()
    flsRes.data?.forEach((f: any) => { if (!latestF.has(f.lead_id)) latestF.set(f.lead_id, f) })
    leads = (baseLeads as any[]).map((l: any) => ({
      ...l,
      activities: latestAct.get(l.id) ? [latestAct.get(l.id)] : [],
      followups: latestF.get(l.id) ? [latestF.get(l.id)] : [],
    })) as any
  }
  
  // Categorize leads (cards view)
  const overdue = (leads as any[])?.filter((l: any) => l.next_follow_up_at && l.next_follow_up_at < now) || []
  const due = (leads as any[])?.filter((l: any) => l.next_follow_up_at && l.next_follow_up_at >= now) || []
  const fresh = (leads as any[])?.filter((l: any) => !l.next_follow_up_at) || []

  return (
    <div className="space-y-4">
      {/* Header: title + actions */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-semibold">Leads</h1>
        <div className="flex items-center gap-2">
          <LeadsFilters status={searchParams.status} search={searchParams.search} due={searchParams.due} />
          <div className="hidden sm:flex items-center gap-1 text-xs border border-white/10 rounded-md overflow-hidden">
            <Link href={{ pathname: '/leads', query: { ...searchParams, view: 'cards' } }} className={`px-2 py-1 ${view==='cards'?'bg-white/10':''}`}>Cards</Link>
            <Link href={{ pathname: '/leads', query: { ...searchParams, view: 'table' } }} className={`px-2 py-1 ${view==='table'?'bg-white/10':''}`}>Table</Link>
          </div>
          <AddLeadButton />
        </div>
      </div>
      
      {leads?.length === 0 ? (
        <EmptyState 
          title="No leads found" 
          hint={searchParams.search || searchParams.status ? "Try adjusting your filters" : "Add your first lead to get started"} 
        />
      ) : view === 'table' ? (
        <LeadsTable leads={leads as any} role={role} />
      ) : (
        <>
          {overdue.length > 0 && (
            <section aria-label="Overdue" className="space-y-2">
              <h2 className="font-semibold text-danger flex items-center gap-2">Overdue <span className="text-xs rounded-full px-2 py-0.5 border border-danger/30 bg-danger/10 text-danger">{overdue.length}</span></h2>
              {overdue.map((l: any) => <LeadCard key={l.id} lead={l as any} role={role} />)}
            </section>
          )}
          
          {due.length > 0 && (
            <section aria-label="Due soon" className="space-y-2">
              <h2 className="font-semibold flex items-center gap-2">Due soon <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{due.length}</span></h2>
              {due.map((l: any) => <LeadCard key={l.id} lead={l as any} role={role} />)}
            </section>
          )}
          
          {fresh.length > 0 && (
            <section aria-label="New" className="space-y-2">
              <h2 className="font-semibold flex items-center gap-2">New <span className="text-xs rounded-full px-2 py-0.5 border border-line bg-black/5 text-fg/70 dark:bg-white/5 dark:text-white/80">{fresh.length}</span></h2>
              {fresh.map((l: any) => <LeadCard key={l.id} lead={l as any} role={role} />)}
            </section>
          )}
        </>
      )}
      
      {totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          totalItems={count || 0}
        />
      )}
    </div>
  )
}
