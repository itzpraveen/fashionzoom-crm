import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTeam, assignUserToTeam, inviteUser, resendInvite, removeUserFromTeam, setUserRole } from '@/actions/teams'

export const dynamic = 'force-dynamic'

export default async function TeamsSettingsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((me?.role ?? 'TELECALLER') !== 'ADMIN') return <div className="text-sm">403 — Admins only.</div>

  const { data: teams } = await supabase.from('teams').select('*').order('created_at', { ascending: true })
  const { data: members } = await supabase.from('profiles').select('id, full_name, role, team_id').order('full_name', { ascending: true })

  async function createTeamAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '')
    await createTeam({ name })
  }
  async function assignAction(formData: FormData) {
    'use server'
    const email = String(formData.get('email') || '')
    const uid = String(formData.get('userId') || '')
    const teamId = String(formData.get('teamId') || '')
    const role = String(formData.get('role') || 'TELECALLER') as any
    await assignUserToTeam({ email: email || undefined, userId: uid || undefined, teamId, role })
  }
  async function inviteAction(formData: FormData) {
    'use server'
    const email = String(formData.get('email') || '')
    const teamId = String(formData.get('teamId') || '')
    const role = String(formData.get('role') || 'TELECALLER') as any
    await inviteUser({ email, teamId: teamId || undefined, role })
  }
  async function resendAction(formData: FormData) {
    'use server'
    const email = String(formData.get('email') || '')
    const userId = String(formData.get('userId') || '')
    await resendInvite({ email: email || undefined, userId: userId || undefined })
  }
  async function removeTeamAction(formData: FormData) {
    'use server'
    const uid = String(formData.get('userId') || '')
    await removeUserFromTeam({ userId: uid })
  }
  async function demoteAction(formData: FormData) {
    'use server'
    const uid = String(formData.get('userId') || '')
    await setUserRole({ userId: uid, role: 'TELECALLER' })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Teams</h1>

      <section className="space-y-2">
        <h2 className="font-medium">Create Team</h2>
        <form action={createTeamAction} className="flex gap-2">
          <input name="name" placeholder="Team name" className="rounded bg-surface-2 border border-line px-3 py-2" required />
          <button className="rounded bg-primary text-white px-3 py-2">Create</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Invite User</h2>
        <form action={inviteAction} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted">Email</label>
            <input name="email" type="email" placeholder="user@example.com" className="w-full rounded bg-surface-2 border border-line px-3 py-2" required />
          </div>
          <div>
            <label className="block text-xs text-muted">Team (optional)</label>
            <select name="teamId" className="w-full rounded bg-surface-2 border border-line px-3 py-2">
              <option value="">—</option>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Role</label>
            <select name="role" className="w-full rounded bg-surface-2 border border-line px-3 py-2">
              {['TELECALLER','MANAGER','ADMIN'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button className="rounded bg-primary text-white px-3 py-2">Send Invite</button>
            <p className="text-xs text-muted mt-1">User will receive a magic link to sign in and complete profile.</p>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Assign User</h2>
        <form action={assignAction} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted">Email (or User ID)</label>
            <input name="email" placeholder="user@example.com" className="w-full rounded bg-surface-2 border border-line px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-muted">User ID (optional)</label>
            <input name="userId" placeholder="uuid" className="w-full rounded bg-surface-2 border border-line px-3 py-2" />
          </div>
          <div>
            <label className="block text-xs text-muted">Team</label>
            <select name="teamId" className="w-full rounded bg-surface-2 border border-line px-3 py-2" required>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Role</label>
            <select name="role" className="w-full rounded bg-surface-2 border border-line px-3 py-2">
              {['TELECALLER','MANAGER','ADMIN'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div>
            <button className="rounded bg-primary text-white px-3 py-2">Assign</button>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Members</h2>
        <div className="overflow-x-auto">
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
              {(members||[]).map((m: any) => (
                <tr key={m.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">{m.full_name || '—'}</td>
                  <td className="py-2 pr-4">{m.role}</td>
                  <td className="py-2 pr-4">{(teams||[]).find((t: any)=>t.id===m.team_id)?.name || '—'}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{m.id}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={resendAction}>
                        <input type="hidden" name="email" value={m.email || ''} />
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
      </section>
    </div>
  )
}
