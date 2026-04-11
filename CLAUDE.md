# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime & Tooling

**Bun is the sole runtime and package manager.** Do not use Node.js, npm, pnpm, or yarn. Bun automatically loads `.env` files.

## Commands

```bash
# Install all workspace dependencies (run from repo root)
bun install

# Development
bun run dev                    # Run all apps in parallel
bun run dev:web                # Astro landing page only
bun run dev:mobile             # Expo dev server only

# Build
bun run build                  # Build all apps
```

## Architecture

Bun monorepo with a single workspace glob: `apps/*`. There is no backend — both apps are fully client-side.

### Apps

- **`apps/web`** — Astro 5 marketing / landing page. Static site, no client JS framework. Entry point is `src/pages/index.astro`, which composes `src/layouts/Base.astro` with components from `src/components/`. The waitlist CTA is a `mailto:` link — no form backend. Deploys to Vercel as a static build (`astro build` → `dist/`).

- **`apps/mobile`** — Expo / React Native app using Expo Router for navigation and NativeWind (Tailwind v3) for styling. State is fully local: **Drizzle ORM over `expo-sqlite`** — no network calls, no auth, no server sync. Schema lives in `db/` and is created on app startup. This is intentional and matches the landing page's "works offline, no accounts" promise.

### Key Patterns

- **No shared package.** Types are colocated with whichever app uses them. If both apps ever need the same type, prefer duplication over premature extraction.
- **No backend.** If you need a server-side capability (waitlist storage, analytics, push notifications), discuss the trade-off before adding one back — the whole point of the current architecture is that there isn't one.
- **Mobile is the source of truth for domain data.** All fines, teams, and allocations live in the device's SQLite database. Any future sync layer should treat the device as authoritative, not the other way round.

### Historical context

An earlier version of this repo had a Hono+Drizzle API in `apps/api` and a shared types package in `packages/shared`. Both were deleted — the mobile app was restructured to be self-sufficient, and the web app became a pure marketing site. If you need to reference the old API code, it is preserved at the `archive/api-v0` git tag.
