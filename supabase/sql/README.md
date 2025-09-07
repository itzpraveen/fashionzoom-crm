Supabase SQL setup

This project ships its database schema and policies as plain SQL files under `supabase/sql/`.

Order
- 001_schema.sql — base schema, functions, RLS and core policies
- 020_relax_leads_insert_policy.sql — minor policy relax for inserting leads without a team
- 060_events_programs.sql — events/programs/enrollments tables + policies
- 030_admin_policies.sql — admin/manager-friendly read/write policies for settings tables

Apply with Supabase SQL editor (quick)
1) Open your Supabase project → SQL editor
2) Paste the contents of each file above in order and run

Apply with Supabase CLI + psql (scriptable)
Prereqs: `psql` and your DB connection string

```
export DB_URL="postgresql://postgres:<password>@<host>:5432/postgres"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/sql/001_schema.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/sql/020_relax_leads_insert_policy.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/sql/060_events_programs.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/sql/030_admin_policies.sql
```

Notes
- Ensure `auth.users` exists (created by Supabase). Profiles table references it.
- Policies rely on `profiles.role` values 'TELECALLER'|'MANAGER'|'ADMIN'. The app normalizes role
  casing and common synonyms, but DB values should be canonical.
- Server env `SUPABASE_SERVICE_ROLE_KEY` is required for bootstrapping routes like `/admin/elevate`.

