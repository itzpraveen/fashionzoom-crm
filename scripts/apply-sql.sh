#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]];nthen
  echo "DATABASE_URL env var is required (postgresql://user:pass@host:5432/db)" >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/sql/001_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/sql/020_relax_leads_insert_policy.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/sql/060_events_programs.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/sql/030_admin_policies.sql

echo "✅ Applied SQL migrations to database"

