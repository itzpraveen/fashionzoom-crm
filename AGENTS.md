# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and pages (e.g., `leads/`, `dashboard/`, `settings/`).
- `components/`: Reusable UI components in PascalCase (e.g., `LeadsTable.tsx`).
- `lib/`: Domain logic and utilities — `services/` (e.g., `leads.service.ts`), `supabase/` clients, `utils/`, `cache/`, `monitoring/`.
- `public/`: Static assets (icons, brand images).
- `supabase/`: SQL migrations and edge functions (e.g., `functions/ingest-lead/`).
- `tests/`: Unit tests under `tests/unit/**.test.ts`; Playwright specs (e.g., `tests/e2e.spec.ts`).

## Build, Test, and Development Commands
- `pnpm dev`: Start local dev server (http://localhost:3000).
- `pnpm build`: Production build via Next.js.
- `pnpm start`: Run the built app.
- `pnpm lint`: Lint with Next/ESLint rules.
- `pnpm typecheck` | `pnpm typecheck:app`: TypeScript checks.
- `pnpm test` | `pnpm test:watch`: Run Vitest once / in watch mode.
- `pnpm e2e` | `pnpm e2e:install`: Run Playwright E2E / install browsers.

## Coding Style & Naming Conventions
- TypeScript + React 18 + Next.js 14 (App Router).
- Indentation: 2 spaces; no semicolons; prefer single quotes.
- Components: PascalCase (`LoginForm.tsx`); hooks `useX`. Modules in `lib/` use kebab-case with domain suffixes (e.g., `*.service.ts`).
- Run `pnpm lint` and `pnpm typecheck` before pushing.

## Testing Guidelines
- Unit: Vitest. Place files as `tests/unit/<area>/**.test.ts`. Keep tests deterministic and fast.
- E2E: Playwright (`playwright.config.ts`). Requires dev server running. First-time: `pnpm e2e:install`.
- Local data: use Demo Mode (`NEXT_PUBLIC_DEMO=1`) when testing without Supabase.

## Commit & Pull Request Guidelines
- Use conventional prefixes: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ui`, `ux`, `brand` (optional scopes: `feat(leads-table): ...`).
- PRs include: summary, linked issue(s), test plan/steps, and screenshots for UI changes. Confirm lint, typecheck, and tests pass.

## Security & Configuration Tips
- Env: copy `.env.example` to `.env.local`; never commit secrets. Service role keys must only be used server-side.
- PWA toggle: `NEXT_PUBLIC_ENABLE_PWA=0|1`. Supabase URLs/keys are required unless using Demo Mode.
