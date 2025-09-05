-- Performance indexes for higher lead volumes

-- Leads: common filters/sorts
create index if not exists leads_owner_deleted_next_idx on public.leads (owner_id, is_deleted, next_follow_up_at);
create index if not exists leads_city_trgm on public.leads using gin (city gin_trgm_ops);
create index if not exists leads_full_name_trgm on public.leads using gin (full_name gin_trgm_ops);

-- Followups
create index if not exists followups_user_status_due_idx on public.followups (user_id, status, due_at);
create index if not exists followups_lead_idx on public.followups (lead_id);

-- Activities
create index if not exists activities_lead_created_idx on public.activities (lead_id, created_at desc);

