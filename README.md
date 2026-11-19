# Doorstep

Doorstep is a two-sided service marketplace. The landing page and illustrative provider information use sample data; registration and account routes connect to Supabase when configured.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project for authentication and database features

## Setup and run

```sh
npm install
cp .env.example .env.local
npx supabase start
npx supabase status -o env
npm run dev
```

Requirements for the local backend are the Supabase CLI and Docker Desktop. The local Supabase stack runs Postgres, Auth, Storage, Studio, and an email inbox for confirmation links. Copy the `API_URL` and `ANON_KEY` values printed by `npx supabase status -o env` into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`; do not copy a service-role key into a `NEXT_PUBLIC_` variable. `supabase/config.toml` enables email confirmation and local mail capture. The email inbox is available at http://127.0.0.1:54324.

`supabase db reset` applies all migrations and seeds the 16 service categories. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for ordinary development. For a separately hosted project, apply the SQL files in `supabase/migrations` in filename order, configure email confirmation, and add the callback URL to the Auth redirect allowlist. Use a test project for automated sign-ups; do not run E2E tests against production.

`LAUNCH_GATE` defaults to `true` when unset. It shows the pre-launch notice and disables credential-record/document submissions. Only the owner should set it to `false`, after legal review. Payment collection is not implemented. Do not store identity or other sensitive documents in the portfolio bucket.

Open http://localhost:3000. If Supabase is not configured, the auth routes explain which settings are needed. No secrets belong in the repository.

If npm dependencies cannot be downloaded, a standalone, no-dependency design preview is available with `npm run preview:static` at http://localhost:3000. It uses clearly labeled illustrative listings and does not save form data. The interactive Next.js app still requires `npm install` and Supabase configuration for live account and marketplace features.

## Current functionality

- Customer and provider registration, email verification, login, password reset, and sign-out use Supabase Auth when configured.
- Provider dashboards can edit business profiles, manage service listings and weekly availability, and upload private portfolio images after the migrations are applied. Row Level Security limits these changes to the owning provider.
- `/browse` combines database-backed published listings with 48 clearly labeled sample professionals across the 16 categories. Search, area, category, maximum price, availability, sorting, and live-listing pagination are available. Rating filters stay disabled until real reviews exist.
- `/providers/[id]` shows live business details, published services, weekly availability, and portfolio images. Doorstep does not currently verify provider identity or licences. Sample profiles keep their booking form in preview mode.
- Live profiles accept booking or quotation requests with a future preferred time and location. Customers and providers can review request status, respond to proposed dates, exchange messages, and view notifications in their dashboards. Providers can send one quote per quotation request; customers can accept or decline it.
- Booking status changes run through database functions and participant-scoped RLS. Reviews are not connected. The compliance migration adds staff review tools, private licence/qualification evidence, privacy requests, safety reports, and category launch controls. Sample content is illustrative and must not be treated as real ratings, reviews, or verification.

The provider portfolio bucket created by the third migration is private, limited to JPEG, PNG, and WebP images up to 5 MB. If that bucket already exists, the migration leaves its existing settings unchanged; verify the privacy and upload limits in Supabase Storage.

## Compliance release gates

- Apply `202611180001_compliance_controls.sql` and `202611180002_compliance_security_hardening.sql` after the existing migrations. All service categories start in **pending** state; public provider profiles, portfolio, availability, and listings remain hidden until an authorized compliance administrator records a review reference and configures required credential checks.
- Provision a compliance administrator through the Supabase SQL editor as described in [docs/compliance-operations.md](docs/compliance-operations.md). Do not use a public sign-up path to grant staff access.
- Providers can submit professional licence, qualification, and reference records in their dashboard. Supporting files go to a private bucket; database and storage policies reject identity-document records and uploads. Identity checks require a separate DPIA and approved process.
- `/privacy` and `/terms` are clearly marked pre-launch drafts. `/report` records a safety/service concern for the restricted staff queue. The forms do not themselves complete a legal request or resolve an incident.
- Browse offers optional location-based recommendations after the customer clicks “Use my location”. Search coordinates are rounded to two decimal places before the RPC request and again inside the database, and are not written to Doorstep marketplace tables. Providers may set an approximate service-area center in their dashboard; centers are private and results show distance without revealing center coordinates. Apply `202611180003_nearby_discovery.sql` to enable this feature. Review Supabase and hosting request-log behavior and retention before launch.
- The prototype does not take payment, hold funds, issue refunds, or provide escrow. Do not accept paid live jobs until the PSP, funds flow, consumer terms, tax, county permits, worker relationship, and legal review are complete.
- No legal compliance claim is made. ODPC registration, final privacy notice/lawful bases/retention schedule, Supabase transfer and processor assessment, worker terms/classification, service/category rules, county permits, and tax responsibilities remain founder/counsel release gates.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npx supabase test db
```

The Playwright checks cover auth screen behavior plus 320px, 390px, 820px, and 1440px widths in light and dark themes, horizontal overflow, and browser console errors. Real registration and email-confirmation E2E cases run when `.env.local` has a test Supabase URL/key and `E2E_MAILBOX_URL` points to the local inbox. The Phase 2 RLS assertions are in `supabase/tests/phase2_auth_rls.test.sql`; compliance and nearby-discovery policy checks are in their corresponding SQL test files. SQL tests require the local Supabase stack.

## Stack

Next.js App Router, React, TypeScript, Supabase Auth and Postgres, CSS custom-property theme tokens, Vitest, and Playwright. Database policies and category seed data are in `supabase/migrations`.
