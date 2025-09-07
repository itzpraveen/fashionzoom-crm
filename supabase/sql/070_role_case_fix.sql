-- Make role checks case-insensitive and include common synonyms
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and upper(p.role) in ('ADMIN','OWNER','SUPERADMIN','SUPER_ADMIN')
  );
$$;

create or replace function public.is_manager() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and upper(p.role) in ('MANAGER','TEAM_LEAD','LEAD')
  );
$$;

