import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/EmptyState'
import { LeadCard } from '@/components/LeadCard'
import { Skeleton } from '@/components/Skeleton'
import { AddLeadButton } from '@/components/AddLeadButton'
import { Pagination } from '@/components/Pagination'
import { redirect } from 'next/navigation'
import { LeadsFilters } from '@/components/LeadsFilters'
import LeadsTable from '@/components/LeadsTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; search?: string; due?: string }
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const page = Number(searchParams.page) || 1
  const offset = (page - 1) * PAGE_SIZE
  const role = (profile?.role ?? 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'
  const view = (searchParams as any).view || (role !== 'TELECALLER' ? 'table' : 'cards')
  
  // Build query
  let query = supabase
    .from('leads')
    .select(`
      id, full_name, primary_phone, city, source, status, score, next_follow_up_at, created_at, last_activity_at, notes,
      owner:profiles(full_name),
      activities(outcome,type,message,created_at),
      followups(remark,created_at)
    `, { count: 'exact' })
    .eq('owner_id', user.id)
    .eq('is_deleted', false)
    .range(offset, offset + PAGE_SIZE - 1)
  
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
  // Latest nested rows only
  // @ts-ignore foreignTable typing
  query = (query as any).order('created_at', { ascending: false, foreignTable: 'activities' }).limit(1, { foreignTable: 'activities' })
  // @ts-ignore foreignTable typing
  query = (query as any).order('created_at', { ascending: false, foreignTable: 'followups' }).limit(1, { foreignTable: 'followups' })
  
  const { data: leads, count, error } = await query
  
  if (error) {
    console.error('Error fetching leads:', error)
    return <EmptyState title="Error loading leads" hint="Please try refreshing the page" />
  }
  
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)
  
  // Categorize leads (cards view)
  const overdue = (leads as any[])?.filter((l: any) => l.next_follow_up_at && l.next_follow_up_at < now) || []
  const due = (leads as any[])?.filter((l: any) => l.next_follow_up_at && l.next_follow_up_at >= now) || []
  const fresh = (leads as any[])?.filter((l: any) => !l.next_follow_up_at) || []

  return (
    <div className="space-y-4">
      {/* Header: actions + view toggle + filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AddLeadButton />
          <div className="hidden sm:flex items-center gap-1 text-xs border border-white/10 rounded-md overflow-hidden">
            <Link href={{ pathname: '/leads', query: { ...searchParams, view: 'cards' } }} className={`px-2 py-1 ${view==='cards'?'bg-white/10':''}`}>Cards</Link>
            <Link href={{ pathname: '/leads', query: { ...searchParams, view: 'table' } }} className={`px-2 py-1 ${view==='table'?'bg-white/10':''}`}>Table</Link>
          </div>
        </div>
        <LeadsFilters status={searchParams.status} search={searchParams.search} due={searchParams.due} />
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
              <h2 className="font-semibold text-danger">Overdue ({overdue.length})</h2>
              {overdue.map((l: any) => <LeadCard key={l.id} lead={l as any} role={role} />)}
            </section>
          )}
          
          {due.length > 0 && (
            <section aria-label="Due soon" className="space-y-2">
              <h2 className="font-semibold">Due soon ({due.length})</h2>
              {due.map((l: any) => <LeadCard key={l.id} lead={l as any} role={role} />)}
            </section>
          )}
          
          {fresh.length > 0 && (
            <section aria-label="New" className="space-y-2">
              <h2 className="font-semibold">New ({fresh.length})</h2>
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
