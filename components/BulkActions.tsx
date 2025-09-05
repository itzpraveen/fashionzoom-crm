'use client'
import { useState } from 'react'
import { Trash2, Edit3, UserPlus, Download } from 'lucide-react'
import { config, features } from '@/lib/config'

interface BulkActionsProps {
  /** Set of selected lead IDs */
  selectedIds: Set<string>
  /** Callback to update multiple leads */
  onBulkUpdate: (ids: string[], updates: any) => Promise<void>
  /** Callback to delete multiple leads */
  onBulkDelete: (ids: string[]) => Promise<void>
  /** Optional callback to assign leads to another user */
  onBulkAssign?: (ids: string[], userId: string) => Promise<void>
  /** Optional callback to export selected leads */
  onExport?: (ids: string[]) => void
  /** Callback to clear the current selection */
  onClearSelection: () => void
}

/**
 * Bulk actions toolbar for performing operations on multiple leads
 * 
 * Features:
 * - Shows when leads are selected and bulk operations are enabled
 * - Update multiple leads (status, tags, score)
 * - Bulk delete with confirmation
 * - Assign leads to team members (if permission allows)
 * - Export selected leads (if feature enabled)
 * - Loading states and error handling
 * 
 * @example
 * ```tsx
 * <BulkActions
 *   selectedIds={selectedLeadIds}
 *   onBulkUpdate={handleBulkUpdate}
 *   onBulkDelete={handleBulkDelete}
 *   onBulkAssign={handleBulkAssign}
 *   onExport={handleExport}
 *   onClearSelection={() => setSelectedLeadIds(new Set())}
 * />
 * ```
 */
export function BulkActions({
  selectedIds,
  onBulkUpdate,
  onBulkDelete,
  onBulkAssign,
  onExport,
  onClearSelection
}: BulkActionsProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  if (!features.isBulkOpsEnabled() || selectedIds.size === 0) {
    return null
  }
  
  const selectedArray = Array.from(selectedIds)
  
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) {
      return
    }
    
    setLoading(true)
    try {
      await onBulkDelete(selectedArray)
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }
  
  const handleBulkUpdate = async (updates: any) => {
    setLoading(true)
    try {
      await onBulkUpdate(selectedArray, updates)
      setShowUpdateModal(false)
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }
  
  const handleBulkAssign = async (userId: string) => {
    if (!onBulkAssign) return
    
    setLoading(true)
    try {
      await onBulkAssign(selectedArray, userId)
      setShowAssignModal(false)
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <>
      <div className="sticky top-0 z-20 bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} selected
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpdateModal(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
            >
              <Edit3 className="h-4 w-4" />
              Update
            </button>
            
            {onBulkAssign && (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                Assign
              </button>
            )}
            
            {features.isExportEnabled() && onExport && (
              <button
                onClick={() => onExport(selectedArray)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
            
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-danger/20 hover:bg-danger/30 text-danger disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            
            <button
              onClick={onClearSelection}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      
      {/* Bulk Update Modal */}
      {showUpdateModal && (
        <BulkUpdateModal
          count={selectedIds.size}
          onUpdate={handleBulkUpdate}
          onClose={() => setShowUpdateModal(false)}
          loading={loading}
        />
      )}
      
      {/* Bulk Assign Modal */}
      {showAssignModal && onBulkAssign && (
        <BulkAssignModal
          count={selectedIds.size}
          onAssign={handleBulkAssign}
          onClose={() => setShowAssignModal(false)}
          loading={loading}
        />
      )}
    </>
  )
}

function BulkUpdateModal({
  count,
  onUpdate,
  onClose,
  loading
}: {
  count: number
  onUpdate: (updates: any) => void
  onClose: () => void
  loading: boolean
}) {
  const [updates, setUpdates] = useState({
    status: '',
    tags: '',
    score: ''
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload: any = {}
    if (updates.status) payload.status = updates.status
    if (updates.tags) payload.tags = updates.tags.split(',').map(t => t.trim())
    if (updates.score) payload.score = parseInt(updates.score)
    
    if (Object.keys(payload).length > 0) {
      onUpdate(payload)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Update {count} lead{count > 1 ? 's' : ''}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={updates.status}
              onChange={(e) => setUpdates({ ...updates, status: e.target.value })}
              className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
            >
              <option value="">Don't change</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
              <option value="DNC">DNC</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={updates.tags}
              onChange={(e) => setUpdates({ ...updates, tags: e.target.value })}
              placeholder="hot-lead, urgent, vip"
              className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={updates.score}
              onChange={(e) => setUpdates({ ...updates, score: e.target.value })}
              placeholder="0-100"
              className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
            />
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!updates.status && !updates.tags && !updates.score)}
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkAssignModal({
  count,
  onAssign,
  onClose,
  loading
}: {
  count: number
  onAssign: (userId: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [userId, setUserId] = useState('')
  
  // TODO: Fetch team members from API
  const teamMembers = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' }
  ]
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userId) {
      onAssign(userId)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Assign {count} lead{count > 1 ? 's' : ''}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assign to</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
            >
              <option value="">Select team member</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !userId}
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}