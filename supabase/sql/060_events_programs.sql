-- Events, Programs, and Lead Enrollments

-- Enums
do $$ begin
  create type enrollment_status as enum ('INTERESTED','APPLIED','ENROLLED','ATTENDED','CANCELLED');
exception when duplicate_object then null; end $$;

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id),
  name text not null,
  season text, -- e.g., SS25, AW25
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- Programs under an event (e.g., Designer Showcase, Sponsor Package A)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  category text, -- optional free-form
  created_at timestamptz not null default now()
);
create index if not exists programs_event_idx on public.programs(event_id);

-- Lead enrollments link a lead with an event/program and track status over time
create table if not exists public.lead_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  status enrollment_status not null default 'INTERESTED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.lead_enrollments_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists lead_enrollments_touch on public.lead_enrollments;
create trigger lead_enrollments_touch before update on public.lead_enrollments
for each row execute function public.lead_enrollments_touch();
create index if not exists lead_enrollments_lead_idx on public.lead_enrollments(lead_id);
create index if not exists lead_enrollments_event_idx on public.lead_enrollments(event_id);
create index if not exists lead_enrollments_program_idx on public.lead_enrollments(program_id);

-- RLS & Policies
alter table public.events enable row level security;
alter table public.programs enable row level security;
alter table public.lead_enrollments enable row level security;

-- Events/programs visible within team; admins see all
create policy if not exists events_team_read on public.events
for select using ( public.is_admin() or public.same_team(team_id) );
create policy if not exists events_team_write on public.events
for all using ( public.is_admin() or public.same_team(team_id) )
with check ( public.is_admin() or public.same_team(team_id) );

create policy if not exists programs_team_read on public.programs
for select using (
  exists(select 1 from public.events e where e.id = event_id and (public.is_admin() or public.same_team(e.team_id)))
);
create policy if not exists programs_team_write on public.programs
for all using (
  exists(select 1 from public.events e where e.id = event_id and (public.is_admin() or public.same_team(e.team_id)))
)
with check (
  exists(select 1 from public.events e where e.id = event_id and (public.is_admin() or public.same_team(e.team_id)))
);

-- Lead enrollments follow lead visibility (owner/team/admin)
create policy if not exists enrollments_rw_by_lead_scope on public.lead_enrollments
for select using (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);
create policy if not exists enrollments_insert_by_lead_scope on public.lead_enrollments
for insert with check (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);
create policy if not exists enrollments_update_by_lead_scope on public.lead_enrollments
for update using (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
)
with check (
  exists (select 1 from public.leads l where l.id = lead_id and (
    l.owner_id = auth.uid() or public.is_admin() or (public.is_manager() and public.same_team(l.team_id))
  ))
);

