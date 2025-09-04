-- FashionZoom CRM base schema and policies
-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists citext;

-- Enums
do $$ begin
  create type lead_source as enum ('Facebook','Instagram','Website','WalkIn','Referral','Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_status as enum ('NEW','CONTACTED','FOLLOW_UP','QUALIFIED','CONVERTED','LOST','DNC');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum ('CALL','WHATSAPP','SMS','EMAIL','NOTE','MEETING');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_outcome as enum ('CONNECTED','NO_ANSWER','BUSY','WRONG_NUMBER','NOT_INTERESTED','INTERESTED','APPOINTMENT_SET');
exception when duplicate_object then null; end $$;

do $$ begin
  create type followup_priority as enum ('LOW','MEDIUM','HIGH');
exception when duplicate_object then null; end $$;

do $$ begin
  create type followup_status as enum ('PENDING','DONE','SKIPPED','OVERDUE');
exception when duplicate_object then null; end $$;

-- Helpers
create or replace function public.normalize_phone(p text)
returns text language sql immutable as $$
  select case
    when p is null then null
    else regexp_replace(regexp_replace(p, '\\D', '', 'g'), '^(91|0)+', '')
  end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Teams & Profiles
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'TELECALLER' check (role in ('TELECALLER','MANAGER','ADMIN')),
  team_id uuid references public.teams(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  primary_phone text not null,
  primary_phone_norm text generated always as (normalize_phone(primary_phone)) stored,
  alt_phone text,
  email citext,
  city text,
  address text,
  pincode text,
  source lead_source not null default 'Other',
  product_interest text,
  tags text[] default '{}',
  status lead_status not null default 'NEW',
  score int not null default 50,
  owner_id uuid references public.profiles(id),
  team_id uuid references public.teams(id),
  last_activity_at timestamptz,
  next_follow_up_at timestamptz,
  consent boolean not null default false,
  notes text,
  custom jsonb not null default '{}'::jsonb,
  duplicate_of_lead_id uuid references public.leads(id),
  is_deleted boolean not null default false
);
create unique index if not exists leads_phone_unique
  on public.leads (primary_phone_norm) where is_deleted = false;
create index if not exists leads_search_trgm
  on public.leads using gin (primary_phone_norm gin_trgm_ops);
create index if not exists leads_status_next_idx
  on public.leads (status, next_follow_up_at);
create trigger leads_touch before update on public.leads
for each row execute function public.touch_updated_at();

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete set null,
  type activity_type not null,
  outcome activity_outcome,
  message text,
  duration_sec int,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Followups
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete set null,
  due_at timestamptz not null,
  priority followup_priority not null default 'MEDIUM',
  status followup_status not null default 'PENDING',
  remark text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id),
  channel text not null check (channel in ('WHATSAPP','SMS','EMAIL')),
  name text not null,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger templates_touch before update on public.templates
for each row execute function public.touch_updated_at();

-- Assignment rules
create table if not exists public.assignment_rules (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id),
  name text not null,
  strategy text not null check (strategy in ('ROUND_ROBIN','BY_CITY','BY_PRODUCT','BY_SOURCE')),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Audit log
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Realtime helper
create or replace function public.bump_lead_activity()
returns trigger language plpgsql as $$
begin
  update public.leads set last_activity_at = now() where id = new.lead_id;
  return new;
end $$;
create trigger activities_bump after insert on public.activities
for each row execute function public.bump_lead_activity();


-- Enable RLS & Policies
alter table public.profiles enable row level security;
alter table public.leads    enable row level security;
alter table public.activities enable row level security;
alter table public.followups  enable row level security;
alter table public.templates  enable row level security;
alter table public.assignment_rules enable row level security;
alter table public.audit_log enable row level security;
alter table public.teams enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN');
$$;

create or replace function public.is_manager() returns boolean
language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'MANAGER');
$$;

create or replace function public.same_team(team uuid) returns boolean
language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = team);
$$;

-- profiles
create policy "profiles_self_read" on public.profiles
for select using ( id = auth.uid() or public.is_admin() or public.is_manager() );
create policy "profiles_self_update" on public.profiles
for update using ( id = auth.uid() ) with check ( id = auth.uid() );

-- leads
create policy "leads_select_owner_or_team" on public.leads
for select using (
  owner_id = auth.uid()
  or public.is_admin()
  or (public.is_manager() and public.same_team(team_id))
);
create policy "leads_insert_owner" on public.leads
for insert with check (
  (owner_id = auth.uid() and public.same_team(team_id))
  or public.is_admin()
  or (public.is_manager() and public.same_team(team_id))
);
create policy "leads_update_owner_or_team" on public.leads
for update using (
  owner_id = auth.uid()
  or public.is_admin()
  or (public.is_manager() and public.same_team(team_id))
)
with check (
  (owner_id = auth.uid() and public.same_team(team_id))
  or public.is_admin()
  or (public.is_manager() and public.same_team(team_id))
);

-- activities & followups scoped by lead visibility
create policy "activities_rw_by_lead_scope" on public.activities
for select using (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);
create policy "activities_insert_by_lead_scope" on public.activities
for insert with check (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);

create policy "followups_rw_by_lead_scope" on public.followups
for select using (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);
create policy "followups_insert_by_lead_scope" on public.followups
for insert with check (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);

-- templates & assignment rules
create policy "templates_team_read" on public.templates
for select using ( public.is_admin() or public.same_team(team_id) );
create policy "templates_team_write" on public.templates
for all using ( public.is_admin() or public.same_team(team_id) )
with check ( public.is_admin() or public.same_team(team_id) );

create policy "assign_team_read" on public.assignment_rules
for select using ( public.is_admin() or public.same_team(team_id) );
create policy "assign_team_write" on public.assignment_rules
for all using ( public.is_admin() or public.same_team(team_id) )
with check ( public.is_admin() or public.same_team(team_id) );

-- audit read
create policy "audit_read_ma" on public.audit_log
for select using ( public.is_admin() or public.is_manager() );

-- teams (RLS)
create policy "teams_select_scope" on public.teams
for select using ( public.is_admin() or public.same_team(id) );
create policy "teams_insert_auth" on public.teams
for insert with check ( auth.uid() is not null );
create policy "teams_update_scope" on public.teams
for update using ( public.is_admin() or public.same_team(id) )
with check ( public.is_admin() or public.same_team(id) );
