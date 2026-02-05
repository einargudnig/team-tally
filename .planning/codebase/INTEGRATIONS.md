# External Integrations

**Analysis Date:** 2026-02-05

## APIs & External Services

**Payment Processing:**
- Not detected

**Email/SMS:**
- Not detected

**External APIs:**
- Not detected

## Data Storage

**Databases:**
- **Current:** In-memory Map storage (`apps/api/src/routes/users.ts`)
  - Volatile: Data lost on restart
  - Prototype only
- **Planned:** SQLite via `bun:sqlite`
  - ORM: Drizzle ORM (per `IMPLEMENTATION_PLAN.md`)
  - Connection: `DATABASE_URL` env var (placeholder in `.env`)
  - Migrations: Drizzle Kit

**File Storage:**
- Not detected

**Caching:**
- Not detected

## Authentication & Identity

**Auth Provider:**
- better-auth v1.4.3 - `apps/api/src/lib/auth.ts`
  - Implementation: Configured but not active
  - Configuration: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` in `.env`
  - Status: Placeholder setup, no routes protected

**OAuth Integrations:**
- Not detected (planned per implementation plan)

## Monitoring & Observability

**Error Tracking:**
- Not detected
- Console logging only

**Analytics:**
- Not detected

**Logs:**
- Console output only
- No structured logging service

## CI/CD & Deployment

**Hosting:**
- Not configured
- Target: Bun runtime

**CI Pipeline:**
- Not configured
- No GitHub Actions workflows

## Environment Configuration

**Development:**
- Required env vars: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- Secrets location: `apps/api/.env` (currently committed - security concern)
- Missing: `.env.example` template file

**Staging:**
- Not configured

**Production:**
- Not configured

## API Documentation

**Service:** Scalar Hono API Reference
- SDK/Client: `@scalar/hono-api-reference` v0.5.177
- Endpoint: `/docs` - Interactive API documentation
- OpenAPI: `/openapi.json` - Basic spec (minimal implementation)
- File: `apps/api/src/index.ts`

## Type-Safe Client

**Library:** @elysiajs/eden (Eden Treaty)
- Purpose: Type-safe API calls from frontend
- File: `apps/web/src/api.ts`
- Usage: `edenTreaty<App>("http://localhost:3000")`
- Exports: API type from `apps/api/src/index.ts`

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

## Planned Integrations (from IMPLEMENTATION_PLAN.md)

**Database Layer:**
- Drizzle ORM v0.41.0
- SQLite via bun:sqlite
- Drizzle Kit v0.30.6 for migrations

**Schema Design (planned):**
- users (id, name, email, timestamps)
- teams (id, name, description, created_by, timestamps)
- team_members (id, team_id, user_id, role, joined_at)
- fines (id, team_id, name, description, amount, fine_date, timestamps)
- allocations (id, fine_id, member_id, quantity, allocated_at, allocated_by)

---

*Integration audit: 2026-02-05*
*Update when adding/removing external services*
