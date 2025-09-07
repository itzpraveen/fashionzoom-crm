"use client"
import { useMemo, useState } from 'react'

export default function MembersTable({
  members,
  teams,
  resendAction,
  removeTeamAction,
  demoteAction
}: {
  members: any[]
  teams: any[]
  resendAction: (formData: FormData) => void
  removeTeamAction: (formData: FormData) => void
  demoteAction: (formData: FormData) => void
}) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return members
    return members.filter((m: any) => {
      const teamName = teams.find((t:any)=>t.id===m.team_id)?.name || ''
      return (
        (m.full_name || '').toLowerCase().includes(term) ||
        (m.role || '').toLowerCase().includes(term) ||
        (teamName.toLowerCase().includes(term)) ||
        String(m.id).toLowerCase().includes(term)
      )
    })
  }, [members, teams, q])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <input
          placeholder="Filter members by name, team, role or ID"
          className="form-input w-80"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto hidden sm:block card p-3 md:p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Team</th>
              <th className="py-2 pr-4">User ID</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m: any) => (
              <tr key={m.id} className="border-t border-white/10">
                <td className="py-2 pr-4">{m.full_name || '—'}</td>
                <td className="py-2 pr-4">{m.role}</td>
                <td className="py-2 pr-4">{teams.find((t:any)=>t.id===m.team_id)?.name || '—'}</td>
                <td className="py-2 pr-4 font-mono text-xs">{m.id}</td>
                <td className="py-2 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <form action={resendAction}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button className="px-2 py-1 rounded bg-white/10 text-xs">Resend invite</button>
                    </form>
                    <form action={removeTeamAction}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button className="px-2 py-1 rounded bg-white/10 text-xs">Remove from team</button>
                    </form>
                    {m.role !== 'TELECALLER' && (
                      <form action={demoteAction}>
                        <input type="hidden" name="userId" value={m.id} />
                        <button className="px-2 py-1 rounded bg-white/10 text-xs">Demote to Telecaller</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

