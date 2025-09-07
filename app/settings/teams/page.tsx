import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTeam, assignUserToTeam, inviteUser, resendInvite, removeUserFromTeam, setUserRole, deleteTeam, renameTeam, moveMembers, bootstrapFirstAdmin } from '@/actions/teams'
import SubmitButton from '@/components/SubmitButton'
import ConfirmSubmit from '@/components/ConfirmSubmit'
import { normalizeRole } from '@/lib/utils/role'
import { getAdminClient } from '@/lib/supabase/admin'
import MembersTable from '@/components/MembersTable'
import { revokeInvite } from '@/actions/teams'
// Read env directly to avoid hard-failing in demo mode
import { bootstrapProfile } from '@/actions/auth'

export const dynamic = 'force-dynamic'

export default async function TeamsSettingsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  // If profile is missing (common if callback bootstrap failed), show a friendly message
  if (!me) {
    async function initProfile() {
      'use server'
      try { await bootstrapProfile() } catch {}
    }
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Teams</h1>
        <p className="text-sm text-muted">Your profile isn’t initialized yet.</p>
        <div className="flex items-center gap-2">
          <form action={initProfile}><SubmitButton className="btn-primary" pendingLabel="Fixing…">Initialize Profile</SubmitButton></form>
          <a href="/logout" className="px-3 py-2 rounded bg-white/10 text-sm">Logout</a>
        </div>
        <p className="text-xs text-muted">If this keeps showing up, sign out and sign back in.</p>
      </div>
    )
  }
  if (normalizeRole(me?.role) !== 'ADMIN') {
    // If there are no admins yet, offer a one-time bootstrap to elevate self.
    // Uses service role on the server (see actions/teams.ts::bootstrapFirstAdmin).
    async function promoteSelf() {
      'use server'
      try {
        await bootstrapFirstAdmin()
      } catch (e) {
        // swallow; page will refresh and show current access
      }
    }
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Teams</h1>
        <p className="text-sm">403 — Admins only.</p>
        <form action={promoteSelf}>
          <button className="px-3 py-2 rounded bg-white/10 text-sm">I am the first admin</button>
        </form>
        <div className="space-y-1">
          <p className="text-xs text-muted">Tip: This works only when no admins exist yet. Otherwise, ask an existing admin to grant you access here.</p>
          {(!process.env.SUPABASE_SERVICE_ROLE_KEY) && (
            <p className="text-xs text-amber-300">Server not fully configured: set SUPABASE_SERVICE_ROLE_KEY in your environment to enable the “first admin” button.</p>
          )}
          <p className="text-xs text-muted">Alternatively, use the bootstrap URL once: <code className="font-mono">/admin/bootstrap?email=you@example.com&token=YOUR_TOKEN</code>.</p>
        </div>
      </div>
    )
  }

  const { data: teams } = await supabase.from('teams').select('*').order('created_at', { ascending: true })
  const { data: members } = await supabase.from('profiles').select('id, full_name, role, team_id').order('full_name', { ascending: true })
  // Pending invites via admin API (safe on server; not exposed to client)
  let pendingInvites: Array<{ id: string; email: string; created_at?: string }> = []
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = getAdminClient() as any
      const res = await admin.auth.admin.listUsers()
      const users: any[] = res?.data?.users || []
      pendingInvites = users
        .filter(u => !u.last_sign_in_at)
        .sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(u => ({ id: u.id, email: String(u.email), created_at: u.created_at }))
    } catch {}
  }

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
    const userId = String(formData.get('userId') || '')
    await resendInvite({ userId: userId || undefined })
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
  async function setRoleAction(formData: FormData) {
    'use server'
    const uid = String(formData.get('userId') || '')
    const role = String(formData.get('role') || 'TELECALLER') as 'TELECALLER'|'MANAGER'|'ADMIN'
    await setUserRole({ userId: uid, role })
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

      {/* Actions split into separate sections for clarity */}
      {/* Create Team */}
      <section className="card p-3 md:p-4 space-y-2">
        <h2 className="font-medium">Create Team</h2>
        <form action={createTeamAction} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input name="name" placeholder="Team name" className="form-input sm:col-span-2" required />
          <SubmitButton className="btn-primary" pendingLabel="Creating…">Create</SubmitButton>
        </form>
      </section>

      {/* Invite User */}
      <section id="invite" className="card p-3 md:p-4 space-y-2">
        <h2 className="font-medium">Invite User</h2>
        <form action={inviteAction} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
          <div className="sm:col-span-3">
            <label className="block text-xs text-muted">Email</label>
            <input name="email" type="email" placeholder="user@example.com" className="form-input" required />
          </div>
          <div className="sm:col-span-2">
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
          <div className="sm:col-span-6 flex items-center justify-between">
            <p className="text-xs text-muted">Sends a magic link to sign in and finish profile.</p>
            <SubmitButton className="btn-primary" pendingLabel="Sending…">Send Invite</SubmitButton>
          </div>
        </form>
      </section>

      {/* Assign User */}
      <section className="card p-3 md:p-4 space-y-2">
        <h2 className="font-medium">Assign User</h2>
        <form action={assignAction} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
          <div className="sm:col-span-3">
            <label className="block text-xs text-muted">Email (or User ID)</label>
            <input name="email" placeholder="user@example.com" className="form-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted">User ID (optional)</label>
            <input name="userId" placeholder="uuid" className="form-input" />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs text-muted">Team</label>
            <select name="teamId" className="form-input" required>
              {(teams||[]).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted">Role</label>
            <select name="role" className="form-input">
              {['TELECALLER','MANAGER','ADMIN'].map(r => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <SubmitButton className="btn-primary w-full" pendingLabel="Assigning…">Assign</SubmitButton>
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Members</h2>
        <MembersTable
          members={members || []}
          teams={teams || []}
          resendAction={resendAction}
          removeTeamAction={removeTeamAction}
          demoteAction={setRoleAction}
        />
      </section>

      {pendingInvites.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Pending Invites</h2>
          <div className="card p-3 md:p-4">
            <ul className="divide-y divide-white/10">
              {pendingInvites.map(u => (
                <li key={u.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs text-muted">Sent {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}. You can assign them to a team later using “Assign User”.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={resendAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="px-2 py-1 rounded bg-white/10 text-xs">Resend</button>
                    </form>
                    <form action={async (fd: FormData) => { 'use server'; await revokeInvite({ userId: String(fd.get('userId')||'') }) }}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button className="px-2 py-1 rounded bg-danger/80 text-white text-xs">Revoke</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-medium">Teams</h2>
        <form action={moveMembersAction} className="card p-3 md:p-4 flex flex-wrap items-end gap-2 mb-2">
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
        <div className="overflow-x-auto hidden sm:block card p-3 md:p-4">
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
