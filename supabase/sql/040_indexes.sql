-- Performance indexes for higher lead volumes

-- Leads: common filters/sorts
create index if not exists leads_owner_deleted_next_idx on public.leads (owner_id, is_deleted, next_follow_up_at);
create index if not exists leads_city_trgm on public.leads using gin (city gin_trgm_ops);
create index if not exists leads_full_name_trgm on public.leads using gin (full_name gin_trgm_ops);
-- Dashboard: recently created leads
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_owner_created_idx on public.leads (owner_id, created_at desc);

-- Followups
create index if not exists followups_user_status_due_idx on public.followups (user_id, status, due_at);
create index if not exists followups_lead_idx on public.followups (lead_id);
-- Dashboard: overdue counts by status
create index if not exists followups_status_due_idx on public.followups (status, due_at);

-- Activities
create index if not exists activities_lead_created_idx on public.activities (lead_id, created_at desc);
-- Dashboard: daily counts and contact rate
create index if not exists activities_created_at_idx on public.activities (created_at desc);
create index if not exists activities_created_outcome_idx on public.activities (created_at desc, outcome);
