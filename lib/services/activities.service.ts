import { z } from 'zod'
import { createServerSupabase } from '../supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Activity schemas
export const ActivitySchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['CALL','WHATSAPP','SMS','EMAIL','NOTE','MEETING']),
  outcome: z.enum(['CONNECTED','NO_ANSWER','BUSY','WRONG_NUMBER','NOT_INTERESTED','INTERESTED','APPOINTMENT_SET']).nullable(),
  message: z.string().nullable(),
  duration_sec: z.number().int().nullable(),
  meta: z.record(z.any()),
  created_at: z.string().datetime()
})

export const CreateActivitySchema = z.object({
  lead_id: z.string().uuid(),
  type: z.enum(['CALL','WHATSAPP','SMS','EMAIL','NOTE','MEETING']),
  outcome: z.enum(['CONNECTED','NO_ANSWER','BUSY','WRONG_NUMBER','NOT_INTERESTED','INTERESTED','APPOINTMENT_SET']).optional(),
  message: z.string().optional(),
  duration_sec: z.number().int().optional(),
  meta: z.record(z.any()).optional()
})

export type Activity = z.infer<typeof ActivitySchema>
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>

// Followup schemas
export const FollowupSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  user_id: z.string().uuid(),
  due_at: z.string().datetime(),
  priority: z.enum(['LOW','MEDIUM','HIGH']),
  status: z.enum(['PENDING','DONE','SKIPPED','OVERDUE']),
  remark: z.string().nullable(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable()
})

export const CreateFollowupSchema = z.object({
  lead_id: z.string().uuid(),
  due_at: z.string().datetime(),
  priority: z.enum(['LOW','MEDIUM','HIGH']),
  remark: z.string().optional()
})

export const UpdateFollowupSchema = z.object({
  status: z.enum(['PENDING','DONE','SKIPPED','OVERDUE']).optional(),
  remark: z.string().optional(),
  completed_at: z.string().datetime().optional()
})

export type Followup = z.infer<typeof FollowupSchema>
export type CreateFollowupInput = z.infer<typeof CreateFollowupSchema>
export type UpdateFollowupInput = z.infer<typeof UpdateFollowupSchema>

export class ActivitiesService {
  constructor(private supabase: SupabaseClient) {}
  
  async createActivity(input: CreateActivityInput, userId: string): Promise<Activity> {
    const validated = CreateActivitySchema.parse(input)
    
    const { data, error } = await this.supabase
      .from('activities')
      .insert({
        ...validated,
        user_id: userId,
        meta: validated.meta || {}
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating activity:', error)
      throw error
    }
    
    return data as Activity
  }
  
  async getActivitiesByLead(leadId: string, limit = 50): Promise<Activity[]> {
    const { data, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching activities:', error)
      throw error
    }
    
    return (data || []) as Activity[]
  }
  
  async getTodaysActivities(userId?: string): Promise<Activity[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let query = this.supabase
      .from('activities')
      .select('*')
      .gte('created_at', today.toISOString())
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching today\'s activities:', error)
      throw error
    }
    
    return (data || []) as Activity[]
  }
  
  async createFollowup(input: CreateFollowupInput, userId: string): Promise<Followup> {
    const validated = CreateFollowupSchema.parse(input)
    
    const { data, error } = await this.supabase
      .from('followups')
      .insert({
        ...validated,
        user_id: userId,
        status: 'PENDING',
        remark: validated.remark || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating followup:', error)
      throw error
    }
    
    return data as Followup
  }
  
  async getFollowupsByLead(leadId: string): Promise<Followup[]> {
    const { data, error } = await this.supabase
      .from('followups')
      .select('*')
      .eq('lead_id', leadId)
      .order('due_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching followups:', error)
      throw error
    }
    
    return (data || []) as Followup[]
  }
  
  async getOverdueFollowups(userId?: string): Promise<Followup[]> {
    const now = new Date().toISOString()
    
    let query = this.supabase
      .from('followups')
      .select('*')
      .lt('due_at', now)
      .eq('status', 'PENDING')
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching overdue followups:', error)
      throw error
    }
    
    return (data || []) as Followup[]
  }
  
  async updateFollowup(id: string, input: UpdateFollowupInput): Promise<Followup> {
    const validated = UpdateFollowupSchema.parse(input)
    
    const { data, error } = await this.supabase
      .from('followups')
      .update(validated)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating followup:', error)
      throw error
    }
    
    return data as Followup
  }
  
  async completeFollowup(id: string): Promise<Followup> {
    return this.updateFollowup(id, {
      status: 'DONE',
      completed_at: new Date().toISOString()
    })
  }
  
  async skipFollowup(id: string, reason?: string): Promise<Followup> {
    return this.updateFollowup(id, {
      status: 'SKIPPED',
      remark: reason,
      completed_at: new Date().toISOString()
    })
  }
  
  async recordDisposition(
    leadId: string,
    outcome: string,
    note?: string,
    nextFollowUp?: { dueAt: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' },
    userId?: string
  ) {
    const user = userId || (await this.supabase.auth.getUser()).data.user?.id
    if (!user) throw new Error('Unauthorized')
    
    // Create activity
    const activity = await this.createActivity({
      lead_id: leadId,
      type: 'CALL',
      outcome: outcome as any,
      message: note
    }, user)
    
    // Create follow-up if provided
    if (nextFollowUp) {
      await this.createFollowup({
        lead_id: leadId,
        due_at: nextFollowUp.dueAt,
        priority: nextFollowUp.priority,
        remark: note
      }, user)
    }
    
    // Update lead status
    const newStatus = outcome === 'CONNECTED' ? 'CONTACTED' : 'FOLLOW_UP'
    await this.supabase
      .from('leads')
      .update({ 
        status: newStatus,
        next_follow_up_at: nextFollowUp?.dueAt || null
      })
      .eq('id', leadId)
    
    return activity
  }
}

// Factory function
export function createActivitiesService() {
  return new ActivitiesService(createServerSupabase())
}
