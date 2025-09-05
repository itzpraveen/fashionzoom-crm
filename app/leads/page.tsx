import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/EmptyState'
import { LeadCard } from '@/components/LeadCard'
import { Skeleton } from '@/components/Skeleton'
import { AddLeadButton } from '@/components/AddLeadButton'
import { Pagination } from '@/components/Pagination'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; search?: string }
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const page = Number(searchParams.page) || 1
  const offset = (page - 1) * PAGE_SIZE
  const role = (profile?.role ?? 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'
  
  // Build query
  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
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
  query = query.order('next_follow_up_at', { ascending: true, nullsFirst: false })
  
  const { data: leads, count, error } = await query
  
  if (error) {
    console.error('Error fetching leads:', error)
    return <EmptyState title="Error loading leads" hint="Please try refreshing the page" />
  }
  
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)
  
  // Categorize leads
  const overdue = leads?.filter((l: any) => l.next_follow_up_at && l.next_follow_up_at < now) || []
  const due = leads?.filter((l: any) => l.next_follow_up_at && l.next_follow_up_at >= now) || []
  const fresh = leads?.filter((l: any) => !l.next_follow_up_at) || []

  return (
    <div className="space-y-4">
      {/* Add Lead CTA and Filters */}
      <div className="flex items-center justify-between gap-4">
        <AddLeadButton />
        <div className="flex gap-2">
          <select
            className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-sm"
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) {
                params.set('status', e.target.value)
              } else {
                params.delete('status')
              }
              params.set('page', '1')
              window.location.href = `?${params.toString()}`
            }}
            defaultValue={searchParams.status || ''}
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
            className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-sm w-48"
            defaultValue={searchParams.search || ''}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams)
              if (e.target.value) {
                params.set('search', e.target.value)
              } else {
                params.delete('search')
              }
              params.set('page', '1')
              // Debounce search
              clearTimeout((window as any).searchTimeout)
              ;(window as any).searchTimeout = setTimeout(() => {
                window.location.href = `?${params.toString()}`
              }, 500)
            }}
          />
        </div>
      </div>
      
      {leads?.length === 0 ? (
        <EmptyState 
          title="No leads found" 
          hint={searchParams.search || searchParams.status ? "Try adjusting your filters" : "Add your first lead to get started"} 
        />
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
