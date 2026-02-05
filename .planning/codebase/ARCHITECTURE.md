# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** Bun Monorepo with Multi-App Architecture

**Key Characteristics:**
- Monorepo using Bun workspaces
- Three independent apps (API, Web, Mobile) sharing types
- Type-safe API client via Eden Treaty
- In-memory data storage (prototype stage)

## Layers

**API Layer** (`apps/api/src/`):
- Purpose: Backend REST API service
- Contains: Route handlers, middleware, auth, environment config
- Entry: `apps/api/src/index.ts` (Hono app)
- Key files: `routes/users.ts`, `lib/auth.ts`, `lib/env.ts`

**Web Frontend Layer** (`apps/web/src/`):
- Purpose: React SPA for browser
- Contains: Components, API client, styles
- Entry: `apps/web/src/main.tsx`
- Key files: `App.tsx`, `api.ts`

**Mobile Layer** (`apps/mobile/`):
- Purpose: Cross-platform mobile app
- Contains: Expo-managed React Native app
- Entry: `apps/mobile/App.tsx`
- Status: Boilerplate only

**Shared Layer** (`packages/shared/`):
- Purpose: Shared types and utilities
- Contains: TypeScript interfaces, helper functions
- Entry: `packages/shared/index.ts`
- Exports: `User`, `UserResponse`, `UsersResponse`, `formatDate()`

## Data Flow

**HTTP Request Lifecycle:**

1. Browser calls `api.users["123"].get()` (Eden Treaty client)
2. HTTP GET to `http://localhost:3000/api/users/123`
3. Hono router matches route, runs middleware chain
4. `zValidator` validates params via Zod schema
5. Route handler queries `usersDb` Map
6. JSON response returned: `{ user: User }`
7. Client receives typed response

**State Management:**
- API: In-memory Map storage (volatile, loses data on restart)
- Web: React component state (`useState`)
- No persistent database implemented yet

## Key Abstractions

**Hono Route Modules:**
- Purpose: Modular route organization
- Examples: `apps/api/src/routes/users.ts`, `apps/api/src/routes/index.ts`
- Pattern: Each route file exports a Hono instance, mounted via `app.route()`

**Zod Schemas:**
- Purpose: Request validation and type inference
- Examples: `userParamSchema`, `createUserSchema`, `updateUserSchema`
- Location: `apps/api/src/routes/users.ts`

**Eden Treaty Client:**
- Purpose: Type-safe API calls from frontend
- File: `apps/web/src/api.ts`
- Pattern: Imports `App` type from API, generates typed client

## Entry Points

**API Server:**
- Location: `apps/api/src/index.ts`
- Triggers: `bun run dev:api` or `bun run --hot src/index.ts`
- Responsibilities: Initialize Hono, mount routes, configure CORS, serve on port 3000

**Web App:**
- Location: `apps/web/src/main.tsx`
- Triggers: `bun run dev:web` or `vite`
- Responsibilities: Render React app to DOM

**Mobile App:**
- Location: `apps/mobile/App.tsx`
- Triggers: `expo start`
- Responsibilities: Expo-managed React Native entry

## Error Handling

**Strategy:** Catch at boundaries, return JSON error responses

**Patterns:**
- Global error handler in `apps/api/src/index.ts`: catches all errors, returns `{ error, message }`
- Development mode exposes error messages; production would hide details
- No structured error logging beyond console

## Cross-Cutting Concerns

**CORS:**
- Global CORS middleware: `app.use("/*", cors())` in `apps/api/src/index.ts`

**Validation:**
- Zod schemas at API boundary via `@hono/zod-validator`
- No frontend validation yet

**Authentication:**
- `better-auth` configured but not active (`apps/api/src/lib/auth.ts`)
- Auth middleware placeholder exists (`apps/api/src/middleware/auth.ts`)

**Logging:**
- Console logging only
- No structured logging framework

---

*Architecture analysis: 2026-02-05*
*Update when major patterns change*
