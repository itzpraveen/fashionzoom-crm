import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTeam, assignUserToTeam, inviteUser, resendInvite, removeUserFromTeam, setUserRole, deleteTeam, renameTeam, moveMembers } from '@/actions/teams'
import SubmitButton from '@/components/SubmitButton'
import ConfirmSubmit from '@/components/ConfirmSubmit'

export const dynamic = 'force-dynamic'

export default async function TeamsSettingsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  // If profile is missing (common if callback bootstrap failed), show a friendly message
  if (!me) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Teams</h1>
        <p className="text-sm text-muted">Your profile isn’t initialized yet. Please sign out and sign back in to complete setup.</p>
        <a href="/logout" className="btn-primary inline-block px-3 py-2 rounded">Logout</a>
      </div>
    )
  }
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
  async function deleteTeamAction(formData: FormData) {
    'use server'
    const teamId = String(formData.get('teamId') || '')
    await deleteTeam({ teamId })
  }
  async function renameTeamAction(formData: FormData) {
    'use server'
    const teamId = String(formData.get('teamId') || '')
    const name = String(formData.get('name') || '')
    await renameTeam({ teamId, name })
  }
  async function moveMembersAction(formData: FormData) {
    'use server'
    const fromTeamId = String(formData.get('fromTeamId') || '')
    const toTeamId = String(formData.get('toTeamId') || '')
    await moveMembers({ fromTeamId, toTeamId })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Teams</h1>

      <section className="space-y-2">
        <h2 className="font-medium">Create Team</h2>
        <form action={createTeamAction} className="flex gap-2">
          <input name="name" placeholder="Team name" className="form-input" required />
          <SubmitButton className="btn-primary" pendingLabel="Creating…">Create</SubmitButton>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Invite User</h2>
        <form action={inviteAction} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted">Email</label>
            <input name="email" type="email" placeholder="user@example.com" className="form-input" required />
          </div>
          <div>
            <label className="block text-xs text-muted">Team (optional)</label>
            <select name="teamId" className="form-input">
              <option value="">—</option>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Role</label>
            <select name="role" className="form-input">
              {['TELECALLER','MANAGER','ADMIN'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton className="btn-primary" pendingLabel="Sending…">Send Invite</SubmitButton>
            <p className="text-xs text-muted mt-1">User will receive a magic link to sign in and complete profile.</p>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Assign User</h2>
        <form action={assignAction} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div>
            <label className="block text-xs text-muted">Email (or User ID)</label>
            <input name="email" placeholder="user@example.com" className="form-input" />
          </div>
          <div>
            <label className="block text-xs text-muted">User ID (optional)</label>
            <input name="userId" placeholder="uuid" className="form-input" />
          </div>
          <div>
            <label className="block text-xs text-muted">Team</label>
            <select name="teamId" className="form-input" required>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">Role</label>
            <select name="role" className="form-input">
              {['TELECALLER','MANAGER','ADMIN'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div>
            <SubmitButton className="btn-primary" pendingLabel="Assigning…">Assign</SubmitButton>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Members</h2>
        {/* Desktop table */}
        <div className="overflow-x-auto hidden sm:block">
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
        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {(members||[]).map((m: any) => (
            <div key={m.id} className="card p-3 border border-line rounded">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{m.full_name || '—'}</div>
                  <div className="text-xs text-muted">{m.role} • {(teams||[]).find((t:any)=>t.id===m.team_id)?.name || '—'}</div>
                  <div className="text-[11px] text-muted font-mono mt-1 break-all">{m.id}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={resendAction}>
                  <input type="hidden" name="email" value={m.email || ''} />
                  <input type="hidden" name="userId" value={m.id} />
                  <button className="touch-target px-3 py-2 rounded bg-white/10 text-xs">Resend invite</button>
                </form>
                <form action={removeTeamAction}>
                  <input type="hidden" name="userId" value={m.id} />
                  <button className="touch-target px-3 py-2 rounded bg-white/10 text-xs">Remove</button>
                </form>
                {m.role !== 'TELECALLER' && (
                  <form action={demoteAction}>
                    <input type="hidden" name="userId" value={m.id} />
                    <button className="touch-target px-3 py-2 rounded bg-white/10 text-xs">Demote</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Teams</h2>
        <form action={moveMembersAction} className="flex flex-wrap items-end gap-2 mb-2">
          <div>
            <label className="block text-xs text-muted">Move members from</label>
            <select name="fromTeamId" className="form-input" required>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted">to</label>
            <select name="toTeamId" className="form-input" required>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <SubmitButton pendingLabel="Moving…" className="btn-primary">Move Members</SubmitButton>
        </form>
        {/* Desktop table */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2 pr-4">Team</th>
                <th className="py-2 pr-4">Members</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(teams||[]).map((t: any) => {
                const count = (members||[]).filter((m: any) => m.team_id === t.id).length
                return (
                <tr key={t.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">
                    <form action={renameTeamAction} className="flex items-center gap-2">
                      <input type="hidden" name="teamId" value={t.id} />
                      <input name="name" defaultValue={t.name} className="form-input w-48 sm:w-64" />
                      <SubmitButton pendingLabel="Saving…" className="px-2 py-1 rounded bg-white/10 text-xs">Save</SubmitButton>
                    </form>
                  </td>
                  <td className="py-2 pr-4">{count}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">
                    <form action={deleteTeamAction} id={`delete-team-${t.id}`}>
                      <input type="hidden" name="teamId" value={t.id} />
                    </form>
                    <ConfirmSubmit
                      formId={`delete-team-${t.id}`}
                      className="px-2 py-1 rounded bg-danger/80 text-white text-xs"
                      confirmMessage="Delete team? This will fail if any users or leads are still assigned."
                    >
                      Delete
                    </ConfirmSubmit>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {(teams||[]).map((t: any) => {
            const count = (members||[]).filter((m:any)=>m.team_id===t.id).length
            return (
              <div key={t.id} className="card p-3 border border-line rounded">
                <form action={renameTeamAction} className="space-y-2">
                  <input type="hidden" name="teamId" value={t.id} />
                  <div className="flex items-center gap-2">
                    <input name="name" defaultValue={t.name} className="form-input flex-1" />
                    <SubmitButton pendingLabel="Saving…" className="px-3 py-2 rounded bg-white/10 text-xs">Save</SubmitButton>
                  </div>
                </form>
                <div className="text-xs text-muted mt-1">Members: {count} • {new Date(t.created_at).toLocaleDateString()}</div>
                <div className="mt-2">
                  <form action={deleteTeamAction} id={`m-delete-team-${t.id}`}>
                    <input type="hidden" name="teamId" value={t.id} />
                  </form>
                  <ConfirmSubmit
                    formId={`m-delete-team-${t.id}`}
                    className="touch-target px-3 py-2 rounded bg-danger/80 text-white text-xs"
                    confirmMessage="Delete team? This will fail if any users or leads are still assigned."
                  >
                    Delete team
                  </ConfirmSubmit>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted">Note: you can delete a team only when no users or leads reference it.</p>
      </section>
    </div>
  )
}
