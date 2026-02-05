# Technology Stack

**Analysis Date:** 2026-02-05

## Languages

**Primary:**
- TypeScript 5.x - All application code across monorepo

**Secondary:**
- JavaScript - Config files (`eslint.config.js`, `vite.config.ts`)

## Runtime

**Environment:**
- Bun 1.3.2+ - Primary runtime for all apps
- No Node.js (explicitly avoided per `CLAUDE.md`)

**Package Manager:**
- Bun workspaces
- Lockfile: `bun.lock` present (304KB)

## Frameworks

**Core:**
- Hono 4.6.14 - API web framework (`apps/api/src/index.ts`)
- React 19.2.0 - Web frontend (`apps/web/`)
- React Native 0.73.0 + Expo 50.0.0 - Mobile app (`apps/mobile/`)

**Testing:**
- Bun test (specified in `CLAUDE.md`, not yet implemented)
- No test files currently exist

**Build/Dev:**
- Vite (rolldown-vite 7.2.5) - Web app bundling (`apps/web/vite.config.ts`)
- Bun bundler - API builds (`bun build src/index.ts --outdir ./dist --target bun`)
- TypeScript 5.9.3 - Compilation

## Key Dependencies

**Critical:**
- `hono` 4.6.14 - HTTP routing and middleware (`apps/api/`)
- `better-auth` 1.4.3 - Authentication framework (`apps/api/src/lib/auth.ts`)
- `zod` 3.24.1 - Schema validation (`apps/api/src/routes/users.ts`)
- `@hono/zod-validator` 0.4.1 - Request validation middleware
- `@elysiajs/eden` - Type-safe API client (`apps/web/src/api.ts`)

**Infrastructure:**
- `@scalar/hono-api-reference` 0.5.177 - API documentation UI (`apps/api/src/index.ts`)
- `react-dom` 19.2.0 - Web rendering
- `expo` 50.0.0 - Mobile cross-platform

## Configuration

**Environment:**
- `.env` files (Bun auto-loads, no dotenv needed)
- `apps/api/.env` contains: PORT, NODE_ENV, DATABASE_URL, JWT_SECRET, BETTER_AUTH_SECRET, BETTER_AUTH_URL

**Build:**
- `tsconfig.json` - Root TypeScript config (ESNext target, bundler resolution)
- `apps/api/tsconfig.json` - API-specific config
- `apps/web/vite.config.ts` - Vite configuration
- `apps/web/eslint.config.js` - ESLint flat config (v9.x)

## Platform Requirements

**Development:**
- macOS/Linux/Windows with Bun installed
- No Docker required for local development

**Production:**
- Bun runtime target
- No deployment platform configured yet

---

*Stack analysis: 2026-02-05*
*Update after major dependency changes*
