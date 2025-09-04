-- Relax insert policy to allow owners without a team to insert leads
drop policy if exists "leads_insert_owner" on public.leads;
create policy "leads_insert_owner" on public.leads
for insert with check (
  (
    owner_id = auth.uid()
    and (team_id is null or public.same_team(team_id))
  )
  or public.is_admin()
  or (public.is_manager() and public.same_team(team_id))
);

