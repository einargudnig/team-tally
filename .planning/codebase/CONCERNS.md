# Codebase Concerns

**Analysis Date:** 2026-02-05

## Tech Debt

**Hardcoded API URL in frontend:**
- Issue: `apps/web/src/api.ts` uses hardcoded `"http://localhost:3000"`
- Why: Quick prototype setup
- Impact: Breaks in production, cannot change API URL without recompile
- Fix approach: Use environment variable for API base URL

**In-memory data storage:**
- Issue: `apps/api/src/routes/users.ts` uses `Map` for user storage
- Why: Prototype stage, no database yet
- Impact: All data lost on server restart, no persistence
- Fix approach: Implement Drizzle ORM with SQLite per `IMPLEMENTATION_PLAN.md`

**Unused legacy server file:**
- Issue: `apps/api/src/simple-server.ts` exists but is not used
- Why: Alternative implementation kept during migration to Hono
- Impact: Code confusion, maintenance burden
- Fix approach: Delete file or clearly mark as deprecated

**Unused Elysia dependencies:**
- Issue: `apps/web/package.json` and `apps/mobile/package.json` include `"elysia": "latest"`
- Why: Copy-paste from initial setup, framework confusion
- Impact: Unnecessary dependencies, tech stack confusion
- Fix approach: Remove Elysia from web and mobile packages

## Known Bugs

**Race condition potential in user ID generation:**
- Symptoms: ID collisions possible if users deleted then created
- Trigger: Delete user, create new user quickly
- File: `apps/api/src/routes/users.ts` line 47: `String(usersDb.size + 1)`
- Workaround: None (data is volatile anyway)
- Root cause: Using Map size as ID counter instead of UUID
- Fix: Use UUID generation or database sequences

## Security Considerations

**.env file committed to git:**
- Risk: Secrets exposed in version control history
- File: `apps/api/.env` contains `BETTER_AUTH_SECRET`, `JWT_SECRET`
- Current mitigation: None
- Recommendations: Remove from git history, add `.env.example` template, ensure `.gitignore` excludes `.env`

**Default fallback secrets:**
- Risk: Insecure defaults used if env vars not set
- File: `apps/api/src/lib/env.ts` uses `"dev-secret"` as default JWT_SECRET
- Current mitigation: None
- Recommendations: Remove default, fail explicitly if secret not set

**Admin role check not implemented:**
- Risk: No server-side authorization
- File: `apps/api/src/middleware/auth.ts` is empty placeholder
- Current mitigation: No protected routes exist yet
- Recommendations: Implement auth middleware before adding sensitive endpoints

## Performance Bottlenecks

**No current performance concerns:**
- Codebase is simple prototype stage
- In-memory storage is fast (but volatile)
- Monitor as database and features are added

## Fragile Areas

**API type export chain:**
- File: `apps/api/src/index.ts` exports `type App = typeof app`
- Why fragile: Frontend type safety depends on correct export
- Common failures: Breaking changes to API break frontend types silently at runtime
- Safe modification: Run type check across monorepo after API changes
- Test coverage: No type integration tests

**Route mounting order:**
- File: `apps/api/src/index.ts`
- Why fragile: Route order affects matching
- Common failures: Catch-all routes before specific routes
- Safe modification: Test route matching after adding routes

## Scaling Limits

**In-memory storage:**
- Current capacity: Limited by server memory
- Limit: Single server instance, no persistence
- Symptoms at limit: Memory exhaustion, data loss on restart
- Scaling path: Implement database layer (SQLite → PostgreSQL if needed)

## Dependencies at Risk

**Elysia/Eden mismatch:**
- Risk: Using Eden Treaty (Elysia client) with Hono server
- Impact: Type inference may not work correctly
- Migration plan: Either switch to Hono RPC or migrate API back to Elysia

## Missing Critical Features

**Database persistence:**
- Problem: No persistent data storage
- Current workaround: In-memory Map (data lost on restart)
- Blocks: Production deployment, real user data
- Implementation complexity: Medium (Drizzle setup + migrations)

**Authentication enforcement:**
- Problem: Auth configured but not enforced on any routes
- Current workaround: None (all routes public)
- Blocks: User-specific data, team ownership
- Implementation complexity: Low (middleware already scaffolded)

**Environment-based configuration:**
- Problem: Hardcoded values for API URL, no staging/production configs
- Current workaround: Manual code changes
- Blocks: Deployment to different environments
- Implementation complexity: Low

## Test Coverage Gaps

**Zero test coverage:**
- What's not tested: Everything (no test files exist)
- Risk: Regressions undetected, refactoring dangerous
- Priority: High
- Difficulty to test: Low (Bun test ready, just need to write tests)
- Start with: API route handlers, Zod schema validation

**Critical paths to test first:**
1. User CRUD operations (`apps/api/src/routes/users.ts`)
2. Zod validation schemas
3. Auth middleware (when implemented)

---

*Concerns audit: 2026-02-05*
*Update as issues are fixed or new ones discovered*
