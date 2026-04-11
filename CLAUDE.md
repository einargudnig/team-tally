# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime & Tooling

**Bun is the sole runtime and package manager.** Do not use Node.js, npm, pnpm, yarn, vite CLI, jest, vitest, dotenv, express, better-sqlite3, ws, or ioredis. Bun provides built-in alternatives for all of these. Bun automatically loads `.env` files.

## Commands

```bash
# Development (from repo root)
bun install                    # Install all workspace dependencies
bun run dev                    # Run all apps in parallel
bun run dev:api                # API only (port 3000)
bun run dev:web                # Web frontend only (Vite dev server)

# Testing
cd apps/api && bun test        # Run API tests
cd apps/api && bun test --watch  # Watch mode
bun test <file>                # Run a single test file

# Database (from apps/api/)
bun run db:generate            # Generate Drizzle migrations
bun run db:migrate             # Apply migrations
bun run db:studio              # Open Drizzle Studio UI

# Build
bun run build                  # Build all apps
```

## Architecture

Bun monorepo with workspaces: `apps/*` and `packages/*`.

### Apps

- **`apps/api`** — Hono REST API on Bun. Routes are modular Hono instances in `src/routes/`, mounted in `src/index.ts`. Middleware chain: CORS → logger → rate limiter → auth. Request validation via `@hono/zod-validator` with Zod schemas defined inline in route files. Database is SQLite via Drizzle ORM (`src/db/schema.ts` for schema, `src/db/index.ts` for connection). Auth scaffolded with `better-auth` but not yet enforced on routes.

- **`apps/web`** — React 19 SPA built with Vite. Uses Eden Treaty (`src/api.ts`) for type-safe API calls derived from the Hono app's exported type. The API client type flows from `apps/api/src/index.ts` → `AppType` export → Eden Treaty generic.

- **`apps/mobile`** — Expo/React Native app (boilerplate only).

### Packages

- **`packages/shared`** — Shared TypeScript types (`User`, `Team`, `Fine`, `Allocation`, etc.) and utilities used across apps.

### Key Patterns

- **Route modules** export a `new Hono()` instance with chained handlers, mounted via `app.route("/api/path", routeModule)` in the API entry point.
- **Type-safe client**: The API app exports its type as `AppType`, which the web app imports to get compile-time route/response checking via Eden Treaty.
- **Database init**: `initializeDatabase()` in `apps/api/src/index.ts` creates tables via raw SQL on startup. Drizzle ORM is used for queries.
- **Environment**: Config in `apps/api/src/lib/env.ts` with defaults. Required vars: `DATABASE_URL`, `JWT_SECRET`, `BETTER_AUTH_SECRET`. Copy `apps/api/.env.example` to `apps/api/.env`.
