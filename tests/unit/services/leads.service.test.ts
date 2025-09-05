import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LeadsService, CreateLeadSchema, UpdateLeadSchema } from '../../../lib/services/leads.service'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client (single shared builder so tests can configure mocks)
const builder: any = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
}
const mockSupabase = {
  from: vi.fn(() => builder)
} as unknown as SupabaseClient

describe('LeadsService', () => {
  let service: LeadsService
  
  beforeEach(() => {
    vi.clearAllMocks()
    service = new LeadsService(mockSupabase)
  })
  
  describe('findById', () => {
    it('should return a lead when found', async () => {
      const mockLead = { 
        id: '123', 
        full_name: 'John Doe',
        primary_phone: '9876543210',
        status: 'NEW' 
      }
      
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.single as any).mockResolvedValue({ data: mockLead, error: null })
      
      const result = await service.findById('123')
      
      expect(result).toEqual(mockLead)
      expect(mockSupabase.from).toHaveBeenCalledWith('leads')
    })
    
    it('should return null when lead not found', async () => {
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.single as any).mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      })
      
      const result = await service.findById('123')
      
      expect(result).toBeNull()
    })
  })
  
  describe('create', () => {
    it('should create a new lead with valid input', async () => {
      const input = {
        full_name: 'Jane Smith',
        primary_phone: '9876543210',
        city: 'Mumbai',
        source: 'Facebook' as const
      }
      
      const expectedLead = {
        ...input,
        id: '456',
        owner_id: 'user123',
        team_id: 'team456'
      }
      
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.single as any).mockResolvedValue({ 
        data: expectedLead, 
        error: null 
      })
      
      const result = await service.create(input, 'user123', 'team456')
      
      expect(result).toEqual(expectedLead)
      expect(mockSupabase.from).toHaveBeenCalledWith('leads')
    })
    
    it('should throw error for duplicate phone number', async () => {
      const input = {
        primary_phone: '9876543210'
      }
      
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.single as any).mockResolvedValue({ 
        data: null, 
        error: { message: 'duplicate key value violates unique constraint' }
      })
      
      await expect(
        service.create(input, 'user123')
      ).rejects.toThrow('A lead with this phone already exists.')
    })
    
    it('should validate input schema', () => {
      const invalidInput = {
        primary_phone: '123', // too short
        email: 'invalid-email'
      }
      
      expect(() => CreateLeadSchema.parse(invalidInput)).toThrow()
    })
  })
  
  describe('update', () => {
    it('should update lead with valid changes', async () => {
      const updates = {
        status: 'CONTACTED' as const,
        city: 'Delhi'
      }
      
      const updatedLead = {
        id: '123',
        ...updates,
        full_name: 'John Doe'
      }
      
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.single as any).mockResolvedValue({ 
        data: updatedLead, 
        error: null 
      })
      
      const result = await service.update('123', updates)
      
      expect(result).toEqual(updatedLead)
    })
  })
  
  describe('findByOwner', () => {
    it('should return paginated results', async () => {
      const mockLeads = [
        { id: '1', full_name: 'Lead 1' },
        { id: '2', full_name: 'Lead 2' }
      ]
      
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.range as any).mockResolvedValue({ 
        data: mockLeads, 
        count: 50,
        error: null 
      })
      
      const result = await service.findByOwner('user123', {
        page: 2,
        pageSize: 20
      })
      
      expect(result.leads).toEqual(mockLeads)
      expect(result.total).toBe(50)
      expect(result.totalPages).toBe(3)
      expect(fromMock.range).toHaveBeenCalledWith(20, 39)
    })
    
    it('should apply filters correctly', async () => {
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.range as any).mockResolvedValue({ 
        data: [], 
        count: 0,
        error: null 
      })
      
      await service.findByOwner('user123', {
        status: 'CONTACTED',
        search: 'john'
      })
      
      expect(fromMock.eq).toHaveBeenCalledWith('status', 'CONTACTED')
      expect(fromMock.or).toHaveBeenCalledWith(
        'full_name.ilike.%john%,primary_phone.ilike.%john%,city.ilike.%john%'
      )
    })
  })
  
  describe('bulkUpdate', () => {
    it('should update multiple leads', async () => {
      const ids = ['1', '2', '3']
      const updates = { status: 'QUALIFIED' as const }
      
      const fromMock = mockSupabase.from('leads')
      ;(fromMock.select as any).mockResolvedValue({ 
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        error: null 
      })
      
      const count = await service.bulkUpdate(ids, updates)
      
      expect(count).toBe(3)
      expect(fromMock.in).toHaveBeenCalledWith('id', ids)
      expect(fromMock.update).toHaveBeenCalledWith(updates)
    })
  })
  
  describe('importBatch', () => {
    it('should import leads in chunks', async () => {
      const rows = Array.from({ length: 1500 }, (_, i) => ({
        full_name: `Lead ${i}`,
        primary_phone: `98765${i.toString().padStart(5, '0')}`
      }))
      
      ;(builder.select as any).mockResolvedValue({ 
        data: Array(500).fill({ id: '1' }),
        error: null 
      })
      
      const result = await service.importBatch(rows, 'user123')
      
      // Should be called 3 times by the service (500 + 500 + 500)
      expect(mockSupabase.from).toHaveBeenCalledTimes(3)
      expect(result.inserted).toBe(1500)
      expect(result.duplicates).toBe(0)
    })
  })
})
