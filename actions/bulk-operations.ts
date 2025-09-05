'use server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { createLeadsService } from '@/lib/services/leads.service'
import { queryCache } from '@/lib/cache/query-cache'

const BulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: z.enum(['NEW','CONTACTED','FOLLOW_UP','QUALIFIED','CONVERTED','LOST','DNC']).optional(),
    tags: z.array(z.string()).optional(),
    score: z.number().int().min(0).max(100).optional(),
    owner_id: z.string().uuid().optional(),
    team_id: z.string().uuid().optional()
  })
})

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100)
})

export async function bulkUpdateLeads(input: {
  ids: string[]
  updates: Record<string, any>
}) {
  const validated = BulkUpdateSchema.parse(input)
  
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // Check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const role = profile?.role as string
  
  // Only managers and admins can bulk update owner/team
  if ((validated.updates.owner_id || validated.updates.team_id) && 
      role !== 'MANAGER' && role !== 'ADMIN') {
    throw new Error('Insufficient permissions to reassign leads')
  }
  
  const service = createLeadsService()
  const count = await service.bulkUpdate(validated.ids, validated.updates)
  
  // Invalidate cache for affected leads
  validated.ids.forEach(id => {
    queryCache.invalidateLead(id, user.id)
  })
  
  return { count }
}

export async function bulkDeleteLeads(input: { ids: string[] }) {
  const validated = BulkDeleteSchema.parse(input)
  
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const service = createLeadsService()
  const count = await service.bulkDelete(validated.ids)
  
  // Invalidate cache
  validated.ids.forEach(id => {
    queryCache.invalidateLead(id, user.id)
  })
  
  return { count }
}

export async function bulkAssignLeads(input: {
  ids: string[]
  userId: string
}) {
  const schema = z.object({
    ids: z.array(z.string().uuid()).min(1).max(100),
    userId: z.string().uuid()
  })
  
  const validated = schema.parse(input)
  
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  // Check permissions - only managers and admins can reassign
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()
  
  const role = profile?.role as string
  if (role !== 'MANAGER' && role !== 'ADMIN') {
    throw new Error('Only managers and admins can reassign leads')
  }
  
  // Verify target user exists and is in same team (for managers)
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, team_id')
    .eq('id', validated.userId)
    .single()
  
  if (!targetUser) {
    throw new Error('Target user not found')
  }
  
  if (role === 'MANAGER' && targetUser.team_id !== profile.team_id) {
    throw new Error('Can only assign leads to team members')
  }
  
  const service = createLeadsService()
  const count = await service.bulkUpdate(validated.ids, {
    owner_id: validated.userId
  })
  
  // Invalidate cache for both users
  validated.ids.forEach(id => {
    queryCache.invalidateLead(id, user.id)
    queryCache.invalidateLead(id, validated.userId)
  })
  
  return { count }
}

export async function exportLeads(input: {
  ids?: string[]
  filters?: {
    status?: string
    search?: string
    ownerId?: string
  }
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  let query = supabase
    .from('leads')
    .select('*')
    .eq('is_deleted', false)
  
  // Apply filters
  if (input.ids && input.ids.length > 0) {
    query = query.in('id', input.ids)
  } else if (input.filters) {
    if (input.filters.ownerId) {
      query = query.eq('owner_id', input.filters.ownerId)
    }
    if (input.filters.status) {
      query = query.eq('status', input.filters.status)
    }
    if (input.filters.search) {
      query = query.or(
        `full_name.ilike.%${input.filters.search}%,primary_phone.ilike.%${input.filters.search}%,city.ilike.%${input.filters.search}%`
      )
    }
  }
  
  // Limit export size
  query = query.limit(1000)
  
  const { data: leads, error } = await query
  
  if (error) throw error
  
  // Convert to CSV
  const headers = [
    'Name',
    'Phone',
    'Email',
    'City',
    'Status',
    'Score',
    'Source',
    'Product Interest',
    'Tags',
    'Created At'
  ]
  
  const rows = (leads || []).map((lead: any) => [
    lead.full_name || '',
    lead.primary_phone,
    lead.email || '',
    lead.city || '',
    lead.status,
    lead.score,
    lead.source,
    lead.product_interest || '',
    (lead.tags || []).join(', '),
    new Date(lead.created_at).toLocaleDateString()
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
  ].join('\n')
  
  return {
    csv,
    count: leads?.length || 0,
    filename: `leads_export_${new Date().toISOString().split('T')[0]}.csv`
  }
}
