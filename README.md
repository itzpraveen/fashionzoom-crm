# FashionZoom CRM

FashionZoom CRM is a web-only PWA for lead capture, calling & WhatsApp follow-ups, and manager oversight. Built with Next.js 14 (App Router, TS), Supabase, Tailwind.

## Features
- Telecaller My Queue with 2-tap Call/WA and quick Disposition Sheet
- Lead Detail with timeline, follow-ups, sticky action bar
- Manager dashboard with realtime tiles
- Import wizard (CSV) with normalization & dedupe by phone
- PWA with offline shell and IndexedDB offline queue
- Zod validation and Next.js Server Actions
- Supabase Realtime on activities/followups; RLS policies for scoping

## Setup

### Env vars
Create a `.env.local` in project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can copy `.env.example` to `.env.local` and fill the values.

### Install & run

```
pnpm install
pnpm dev
```

Open http://localhost:3000

To run E2E tests locally, install Playwright browsers once:

```
pnpm e2e:install
```

### Database
Run SQL migrations in Supabase:
- supabase/sql/001_schema.sql
- supabase/sql/010_seed.sql (optional seed of ~150 Kerala leads)
 - supabase/sql/020_relax_leads_insert_policy.sql (allow owners without team to create leads)

### Edge Function (lead ingestion)
Serve locally:

```
supabase functions serve ingest-lead --no-verify-jwt
```

Deploy via Supabase CLI. Function path: `supabase/functions/ingest-lead/index.ts`

## Tests

- Unit (Vitest): `pnpm test`
- E2E (Playwright): `pnpm e2e`

Note: E2E tests expect the dev server running and a signed-in session or seeded state matching the test assumptions.

## Notes

- Phone masking is applied in list views for non-managers. Full phone appears on detail if role is MANAGER/ADMIN.
- Simple in-memory rate limiting guards server actions.
- Service worker caches app shell; basic offline support included.
- Manifest icons use SVG to avoid missing PNG assets; replace with your brand icons anytime under `public/icons/`.

## Auth Setup (Supabase)

- Site URL: set to your production domain (e.g., `https://fzcrm.vercel.app`).
- Additional Redirect URLs: add the following for magic links and local dev:
  - `http://localhost:3000`
  - `http://localhost:3000/onboarding`
  - `https://fzcrm.vercel.app`
  - `https://fzcrm.vercel.app/onboarding`
- Email OTP: enable Magic Links. Optionally customize the email template; links should open in the same tab.
- Cookies: leave defaults. We check for `sb-access-token` in middleware for routing.

### Login flow
- `/login` sends a magic link with `emailRedirectTo` set to `/onboarding`.
- `/onboarding` completes profile (creates team optionally) and redirects to `/dashboard`.
- Authenticated access is enforced with `middleware.ts` on `/dashboard`, `/leads`, `/followups`, `/import`, `/settings`.
- Hitting `/login` when already authenticated will redirect to `/dashboard`.
