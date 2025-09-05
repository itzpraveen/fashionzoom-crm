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
NEXT_PUBLIC_ENABLE_PWA=0

### Optional: Demo Mode
For quick local exploration without Supabase credentials, you can run in Demo Mode:

```
NEXT_PUBLIC_DEMO=1
```

This uses an in-memory store with seeded data and mock auth. Do not use in production.
```

You can copy `.env.example` to `.env.local` and fill the values. Optionally set `NEXT_PUBLIC_ENABLE_PWA=1` to enable the service worker in development.

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
 - supabase/sql/030_admin_policies.sql (admin RLS policies for Teams/Templates/Assignment Rules/Audit Log)

### Edge Function (lead ingestion)
Serve locally:

```
supabase functions serve ingest-lead --no-verify-jwt
```

Deploy via Supabase CLI. Function path: `supabase/functions/ingest-lead/index.ts`

## Tests

- Unit (Vitest): `pnpm test`
- E2E (Playwright): `pnpm e2e`
- Typecheck (app only): `pnpm typecheck:app`

Note: E2E tests expect the dev server running and a signed-in session or seeded state matching the test assumptions.

## Notes

- Phone masking is applied in list views for non-managers. Full phone appears on detail if role is MANAGER/ADMIN.
- Simple in-memory rate limiting guards server actions.
- PWA is disabled during active development to avoid caching issues; a small unregistration helper runs in layout when the flag is off. To enable PWA behavior, set `NEXT_PUBLIC_ENABLE_PWA=1` in your env.
- Manifest icons use SVG; replace with your brand icons any time under `public/icons/`.

### PWA toggle
- `NEXT_PUBLIC_ENABLE_PWA=1` registers `public/sw.js` globally via the root layout.
- `NEXT_PUBLIC_ENABLE_PWA=0` (default) prevents SW registration and proactively unregisters any prior workers and caches.

## Housekeeping / Cleanup
- Middleware auth gating removed to avoid redirect loops; routes enforce auth server‑side.
- Debug routes and unused utilities removed (`/auth/status`, offline queue, Toast component, legacy SW register).
- Login is a server component that redirects if already authenticated; the client form is in `components/LoginForm.tsx`.
- Onboarding route now just redirects to `/leads`; team setup and other onboarding tasks can be managed later from the Admin panel (`/settings/teams`).

## Auth Setup (Supabase)

- Site URL: set to your production domain (e.g., `https://fzcrm.vercel.app`).
- Additional Redirect URLs: add the following for magic links and local dev:
  - `http://localhost:3000`
  - `https://fzcrm.vercel.app`
- Email OTP: enable Magic Links. Optionally customize the email template; links should open in the same tab.
- Cookies: leave defaults. Authentication is enforced server-side by checking the Supabase session in each page.

### Login flow
- `/login` sends a magic link with `emailRedirectTo` set to `/auth/callback?redirect=/dashboard` (or your chosen path).
- `/auth/callback` exchanges the code, bootstraps a profile on the server, and redirects to the target (default `/dashboard`).
- Authenticated access is enforced server-side on `/dashboard`, `/leads`, `/followups`, `/import`, `/settings`.
- Hitting `/login` when already authenticated will redirect to `/dashboard`.

## Theme (Light/Dark)
- Theme variables live in `app/globals.css` and support light, dark, and system.
- Users can toggle with the selector in the header (component: `components/ThemeToggle.tsx`).
- The selection persists in `localStorage` (`fzcrm-theme`).
- The `<meta name="theme-color">` is set via `viewport` for both schemes.
