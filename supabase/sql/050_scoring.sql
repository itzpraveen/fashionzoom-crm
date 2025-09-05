-- Lead scoring helpers and triggers

create or replace function public.compute_lead_score(p_status text, p_last_activity timestamptz)
returns int language plpgsql immutable as $$
declare
  v_score int := 50;
  v_days int := 0;
begin
  if p_status = 'NEW' then v_score := v_score + 10; end if;
  if p_status = 'CONTACTED' then v_score := v_score + 5; end if;
  if p_status = 'QUALIFIED' then v_score := v_score + 15; end if;
  if p_status = 'CONVERTED' then return 100; end if;
  if p_last_activity is not null then
    v_days := greatest(0, floor(extract(epoch from (now() - p_last_activity)) / 86400)::int);
    v_score := v_score - least(30, v_days);
  end if;
  if v_score < 0 then v_score := 0; end if;
  if v_score > 100 then v_score := 100; end if;
  return v_score;
end $$;

-- Update last_activity_at and recomputed score on activity insert
create or replace function public.bump_lead_activity()
returns trigger language plpgsql as $$
begin
  update public.leads
    set last_activity_at = now(),
        score = public.compute_lead_score(status::text, now())
  where id = new.lead_id;
  return new;
end $$;

-- Recompute score when status changes
create or replace function public.recompute_score_on_status()
returns trigger language plpgsql as $$
begin
  new.score := public.compute_lead_score(new.status::text, new.last_activity_at);
  return new;
end $$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
for each row execute function public.recompute_score_on_status();

