import { z } from 'zod'
import { createServerSupabase } from '../supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Lead schemas
export const LeadSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  primary_phone: z.string(),
  primary_phone_norm: z.string().nullable(),
  alt_phone: z.string().nullable(),
  email: z.string().email().nullable(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  pincode: z.string().nullable(),
  source: z.enum(['Facebook','Instagram','Website','WalkIn','Referral','Other']),
  product_interest: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.enum(['NEW','CONTACTED','FOLLOW_UP','QUALIFIED','CONVERTED','LOST','DNC']),
  score: z.number().int().min(0).max(100),
  owner_id: z.string().uuid().nullable(),
  team_id: z.string().uuid().nullable(),
  last_activity_at: z.string().datetime().nullable(),
  next_follow_up_at: z.string().datetime().nullable(),
  consent: z.boolean(),
  notes: z.string().nullable(),
  custom: z.record(z.any()),
  duplicate_of_lead_id: z.string().uuid().nullable(),
  is_deleted: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const CreateLeadSchema = z.object({
  full_name: z.string().optional(),
  primary_phone: z.string().min(5),
  alt_phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  source: z.enum(['Facebook','Instagram','Website','WalkIn','Referral','Other']).optional(),
  product_interest: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  consent: z.boolean().optional()
})

export const UpdateLeadSchema = z.object({
  full_name: z.string().optional(),
  alt_phone: z.string().optional(),
  email: z.string().email().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  status: z.enum(['NEW','CONTACTED','FOLLOW_UP','QUALIFIED','CONVERTED','LOST','DNC']).optional(),
  product_interest: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  consent: z.boolean().optional(),
  next_follow_up_at: z.string().datetime().optional(),
  score: z.number().int().min(0).max(100).optional(),
  owner_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional()
})

export type Lead = z.infer<typeof LeadSchema>
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>

export class LeadsService {
  constructor(private supabase: SupabaseClient) {}
  
  async findById(id: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching lead:', error)
      return null
    }
    
    return data as Lead
  }
  
  async findByOwner(
    ownerId: string,
    options: {
      page?: number
      pageSize?: number
      status?: string
      search?: string
      includeDeleted?: boolean
    } = {}
  ) {
    const { 
      page = 1, 
      pageSize = 20, 
      status, 
      search,
      includeDeleted = false 
    } = options
    
    const offset = (page - 1) * pageSize
    
    let query = this.supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId)
    
    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,primary_phone.ilike.%${search}%,city.ilike.%${search}%`
      )
    }
    
    query = query
      .order('next_follow_up_at', { ascending: true, nullsFirst: false })
      .range(offset, offset + pageSize - 1)
    
    const { data, count, error } = await query
    
    if (error) {
      console.error('Error fetching leads:', error)
      throw error
    }
    
    return {
      leads: (data || []) as Lead[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  }
  
  async create(input: CreateLeadInput, userId: string, teamId?: string): Promise<Lead> {
    const validated = CreateLeadSchema.parse(input)
    
    const payload = {
      ...validated,
      source: validated.source || 'Other',
      owner_id: userId,
      team_id: teamId || null
    }
    
    const { data, error } = await this.supabase
      .from('leads')
      .insert(payload)
      .select()
      .single()
    
    if (error) {
      if (error.message?.toLowerCase().includes('duplicate') || 
          error.message?.toLowerCase().includes('unique')) {
        throw new Error('A lead with this phone already exists.')
      }
      throw error
    }
    
    return data as Lead
  }
  
  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const validated = UpdateLeadSchema.parse(input)
    
    const { data, error } = await this.supabase
      .from('leads')
      .update(validated)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating lead:', error)
      throw error
    }
    
    return data as Lead
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('leads')
      .update({ is_deleted: true })
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting lead:', error)
      throw error
    }
  }
  
  async bulkUpdate(
    ids: string[], 
    update: Partial<UpdateLeadInput>
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from('leads')
      .update(update)
      .in('id', ids)
      .select('id')
    
    if (error) {
      console.error('Error bulk updating leads:', error)
      throw error
    }
    
    return data?.length || 0
  }
  
  async bulkDelete(ids: string[]): Promise<number> {
    const { data, error } = await this.supabase
      .from('leads')
      .update({ is_deleted: true })
      .in('id', ids)
      .select('id')
    
    if (error) {
      console.error('Error bulk deleting leads:', error)
      throw error
    }
    
    return data?.length || 0
  }
  
  async importBatch(
    rows: Array<{ full_name: string; primary_phone: string; city?: string; source?: string }>,
    userId: string,
    teamId?: string
  ) {
    const chunk = <T,>(arr: T[], size: number) => 
      arr.reduce<T[][]>((acc, _, i) => 
        (i % size ? acc : [...acc, arr.slice(i, i + size)]), []
      )
    
    let inserted = 0
    const chunks = chunk(rows, 500)
    
    for (const c of chunks) {
      const payload = c.map(r => ({
        full_name: r.full_name,
        primary_phone: r.primary_phone,
        city: r.city || null,
        source: (r.source as any) || 'Other',
        owner_id: userId,
        team_id: teamId || null
      }))
      
      const { data, error } = await this.supabase
        .from('leads')
        .upsert(payload, { onConflict: 'primary_phone_norm', ignoreDuplicates: true })
        .select('id')
      
      if (error) throw error
      inserted += (data?.length || 0)
    }
    
    return { 
      inserted, 
      duplicates: rows.length - inserted 
    }
  }
  
  async getStats(ownerId?: string, teamId?: string) {
    let query = this.supabase
      .from('leads')
      .select('status', { count: 'exact' })
      .eq('is_deleted', false)
    
    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }
    
    if (teamId) {
      query = query.eq('team_id', teamId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching lead stats:', error)
      throw error
    }
    
    const stats = (data || []).reduce((acc, lead) => {
      const status = lead.status
      acc[status] = (acc[status] || 0) + 1
      acc.total = (acc.total || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return stats
  }
}

// Factory function to create service with server supabase client
export function createLeadsService() {
  return new LeadsService(createServerSupabase())
}
