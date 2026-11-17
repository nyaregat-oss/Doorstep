# Doorstep: production build spec

Doorstep is a two-sided service marketplace: customers find and book professionals, and providers list services and manage requests.

A working front-end prototype is in `prototype/index.html` (single file, plain HTML/CSS/JS, all data is in-memory sample data). **Your job is to turn it into a real application with a real backend. Port the existing design and behavior; do not redesign it.**

## Ground rules

1. Work in small phases (see Phases). Finish, test, and commit one phase before starting the next.
2. Keep the prototype's look and behavior: design tokens, layout, copy tone, filters, sorting, light and dark themes. Open `prototype/index.html` in a browser to see them.
3. Never fake a backend. If a feature is not connected to real data, label it as a demo. Remove "Sample" labels only where real data replaces sample data.
4. No secrets in the repo. Use `.env.local` and provide `.env.example`.
5. Every table gets Row Level Security (RLS). Write a test for each policy.
6. Write tests for business logic (booking state machine, filtering, permissions). Run lint, typecheck, and tests before finishing each phase.
7. Ask before adding paid services or large new dependencies.

## Recommended stack (change only with a reason)

- Next.js (App Router) + TypeScript
- Supabase: Postgres, Auth (email + password, email verification, password reset), Storage (portfolio images, avatars), RLS
- Tailwind CSS, with the prototype's CSS variables ported as theme tokens
- Playwright for end-to-end tests, Vitest for unit tests
- Hosting: Vercel (or any Node host)

## Design tokens (from the prototype)

Light: bg `#F6F7F9`, surface `#FFFFFF`, ink `#10202F`, muted `#566679`, brand `#0F4C81`, accent `#FFC845`, line `#DCE2E9`.
Dark (true black): bg `#000000`, surface `#0C0F13`, ink `#EEF2F6`, muted `#9AA9B9`, brand `#6FB1F0`, line `#1E2630`.
Fonts: Bricolage Grotesque (headings), Figtree (body). Theme choice persists (localStorage) and defaults to the system setting.
Quality floor: no horizontal overflow from 320px up, visible focus rings, text contrast of at least 4.5:1, respects reduced motion.

## Routes

| Route | Purpose | Prototype equivalent |
|---|---|---|
| `/` | Landing page: hero search, how it works, categories, featured providers, trust, FAQ, CTA | Home view |
| `/browse` | Provider search with filters and sorting | `#browse` |
| `/providers/[id]` | Provider profile and booking request | `#pro-I-J` |
| `/register`, `/login`, `/reset-password` | Auth | Sign-up form (preview only) |
| `/dashboard/customer` | Requests, bookings, saved providers, notifications | `#customer-demo` |
| `/dashboard/provider` | Requests, services, profile completion, analytics, notifications | `#provider-demo` |

## Data model (Postgres)

- `profiles`: id (= auth user id), role (`customer` | `provider`), full_name, phone, created_at
- `categories`: id, name, description, icon, sort_order, active (configurable, seed the 16 in the prototype)
- `provider_profiles`: profile_id, business_name, category_id, location/area, bio, years_experience, verified (bool, admin-set), paused (bool)
- `services`: id, provider_id, name, starting_price, active (supports edit, pause, delete)
- `portfolio_items`: id, provider_id, storage_path, caption
- `availability`: provider_id, weekday or date, open (bool), optional time range
- `bookings`: id, customer_id, provider_id, service_id, requested_date, note, status, proposed_date, created_at
  - status: `pending` → `accepted` | `declined` | `proposed`; `proposed` → `accepted` | `declined` (customer decides); `accepted` → `completed` | `cancelled`
- `reviews`: id, booking_id (unique), rating 1-5, body. Only the booking's customer may create one, only after `completed`.
- `saved_providers`: customer_id, provider_id
- `messages`: id, booking_id, sender_id, body, created_at
- `notifications`: id, user_id, type, body, read, created_at

Provider rating and job count are derived from reviews and completed bookings, never stored by hand.

## RLS summary

- Public (anon) can read active, unpaused provider profiles, their services, portfolio, availability, and reviews.
- A user can read and update only their own profile, saved providers, and notifications.
- A booking is visible only to its customer and its provider. Only the provider may accept, decline, or propose a date on a `pending` booking. Only the customer may respond to `proposed`. Enforce the state machine in a database function or constraint, not only in the UI.
- Only a provider may edit their own services, portfolio, and availability.
- `verified` can be changed only by an admin role.

## Auth and registration

- Toggle "I need a service" | "I offer a service".
- Customer fields: full name, email, phone, password.
- Provider fields: full name, business name, email, phone, main category, location, password.
- Email verification required; password reset by email; logout; session handling via Supabase.
- After sign-up or login, redirect to the matching dashboard.
- Validate on the client and the server. Never reveal whether an email is registered in reset flows.

## Behaviors to preserve from the prototype

- Landing search (service, location, optional budget) leads to `/browse` with the filters applied.
- Browse filters: category, area, starting price ("Up to $X", inclusive), minimum rating, availability, verified only. Sorting: top rated, lowest price, most jobs. "Clear filters" resets all. Empty state when nothing matches.
- Provider profile: about, services and prices, portfolio, reviews, weekly availability, booking request form (service, date not in the past, description).
- Page title changes per view. Focus moves to the page heading on route change. Returning from a profile to browse restores scroll position and filters.
- The location filter must actually filter once real locations exist (in the prototype it only filters made-up neighborhoods).

## Phases and acceptance criteria

1. **Foundation.** Project scaffold, theme tokens, layout, landing page ported, CI running lint, typecheck, tests. *Done when the landing page matches the prototype in light and dark and passes the quality floor.*
2. **Database and auth.** Migrations, seed categories, RLS, register/login/logout/reset/verify, role redirects. *Done when a customer and a provider can each register, verify email, log in, and see only their own dashboard.*
3. **Provider side.** Profile editing, services CRUD, availability, portfolio upload, completion indicator, publish/pause. *Done when a new provider can publish a profile that appears in browse.*
4. **Discovery.** Browse and profile pages on real data, all filters and sorts, pagination. *Done when every filter combination returns correct results (add tests).*
5. **Bookings.** Request, accept, decline, propose date, customer response, complete, cancel, with notifications. *Done when the state machine is enforced in the database and covered by tests.*
6. **Trust and engagement.** Reviews after completed bookings, saved providers, messaging per booking, admin verification.
7. **Hardening.** Rate limiting, input sanitization, error and loading states, accessibility audit, performance check, privacy page and terms placeholders.

## Not yet specified

The original product brief was cut off after the booking section. Items likely still to come (confirm with the product owner before building): messaging details, review moderation, availability calendar rules, analytics, payments, admin tools, and notification delivery (in-app only or email too).

> PASTE THE REMAINDER OF THE ORIGINAL BRIEF HERE.

## Final QA checklist (run before each release)

- [ ] No console errors or failed network requests on any page
- [ ] No horizontal scroll at 320, 390, 820, 1024, 1440px, in light and dark
- [ ] Text contrast at least 4.5:1 everywhere, including badges and buttons
- [ ] All 16 categories return results (once real providers exist)
- [ ] Mobile header reaches every main page
- [ ] Forms show clear validation errors and success states
- [ ] Theme persists across reloads
- [ ] Keyboard-only walkthrough of search, booking, and both dashboards
