# Doorstep

Phase 1 foundation for the Doorstep service marketplace. The landing page and its illustrative provider information use sample data only. Search and signup are previews; no form data is saved or sent. No database or authentication is configured.

## Requirements

- Node.js 20 or newer
- npm

## Setup and run

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `.env.local` is optional in Phase 1 and contains no required settings.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

The Playwright landing-page check covers 320px and 1440px widths in light and dark themes. It checks horizontal overflow and browser console errors.

## Stack

Next.js App Router, React, TypeScript, CSS custom-property theme tokens, Vitest, and Playwright. Phase 2 will introduce Supabase auth and database according to `AGENTS.md`.
