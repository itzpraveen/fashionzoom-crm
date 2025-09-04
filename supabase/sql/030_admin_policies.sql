-- Admin-friendly RLS policies for settings tables
-- Apply in Supabase SQL editor or via CLI after 001_schema.sql

-- TEAMS: allow admins to read/write
drop policy if exists teams_select_admin on public.teams;
create policy teams_select_admin on public.teams
for select using ( public.is_admin() );

drop policy if exists teams_write_admin on public.teams;
create policy teams_write_admin on public.teams
for all using ( public.is_admin() ) with check ( public.is_admin() );

-- TEMPLATES: allow admins to read/write, managers read
drop policy if exists templates_select_admin_mgr on public.templates;
create policy templates_select_admin_mgr on public.templates
for select using ( public.is_admin() or public.is_manager() );

drop policy if exists templates_write_admin on public.templates;
create policy templates_write_admin on public.templates
for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ASSIGNMENT RULES: admins read/write, managers read
drop policy if exists assignment_rules_select_admin_mgr on public.assignment_rules;
create policy assignment_rules_select_admin_mgr on public.assignment_rules
for select using ( public.is_admin() or public.is_manager() );

drop policy if exists assignment_rules_write_admin on public.assignment_rules;
create policy assignment_rules_write_admin on public.assignment_rules
for all using ( public.is_admin() ) with check ( public.is_admin() );

-- AUDIT LOG: admins read
drop policy if exists audit_log_select_admin on public.audit_log;
create policy audit_log_select_admin on public.audit_log
for select using ( public.is_admin() );

