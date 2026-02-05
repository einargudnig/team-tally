# Coding Conventions

**Analysis Date:** 2026-02-05

## Naming Patterns

**Files:**
- kebab-case for utility/service files: `auth.ts`, `db.ts`, `env.ts`
- PascalCase for React components: `App.tsx`
- index.ts for module exports
- *.test.ts for tests (not yet implemented)

**Functions:**
- camelCase for all functions: `formatDate()`, `createUser()`
- No special prefix for async functions
- Handler names match HTTP method context

**Variables:**
- camelCase for variables: `usersDb`, `userParamSchema`
- UPPER_SNAKE_CASE for environment variables: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces: `User`, `UserResponse`, `UsersResponse`
- PascalCase for type aliases
- Schema suffix for Zod schemas: `userParamSchema`, `createUserSchema`, `updateUserSchema`

## Code Style

**Formatting:**
- 2-space indentation (consistent across all files)
- No semicolons at end of statements
- Double quotes for strings
- Blank lines between logical sections

**Linting:**
- ESLint 9.x with flat config (`apps/web/eslint.config.js`)
- TypeScript-ESLint for type checking
- React hooks rules enabled
- No Prettier config (ESLint handles formatting)

## Import Organization

**Order:**
1. External packages (`hono`, `react`, `zod`)
2. Workspace packages (`@team-tally/shared`, `@team-tally/api`)
3. Relative imports (`./routes/users.js`, `./api`)

**Grouping:**
- Blank line between import groups
- Type imports use `import type { }` syntax

**Path Aliases:**
- Workspace imports: `@team-tally/shared`, `@team-tally/api`
- No path aliases within apps (use relative imports)

**Note:** API imports use `.js` extension for ESM compatibility: `import { users } from "./routes/users.js"`

## Error Handling

**Patterns:**
- Global error handler at app level (`apps/api/src/index.ts`)
- Return JSON error responses: `{ error: true, message: string }`
- Development mode shows error details

**Error Types:**
- Throw errors for validation failures
- Return 404 for not found: `c.json({ error: true, message: "User not found" }, 404)`
- Return 201 for created: `c.json({ message: "User created", user }, 201)`

## Logging

**Framework:**
- Console logging only (`console.log`, `console.error`)
- No structured logging library

**Patterns:**
- Log server startup: `console.log("Server running on port...")`
- Log errors in global handler
- No request logging middleware

## Comments

**When to Comment:**
- Inline comments for route descriptions: `// GET /api/users - List all users`
- Section dividers for clarity
- No JSDoc comments (code is self-documenting)

**TODO Comments:**
- Standard format: `// TODO: description`
- No issue linking convention established

## Function Design

**Size:**
- Route handlers are focused (single responsibility)
- Extract validation to Zod schemas

**Parameters:**
- Use Hono context `c` for request/response
- Destructure validated data: `const { id } = c.req.valid("param")`

**Return Values:**
- Always return `c.json()` for API responses
- Include status code for non-200: `c.json(data, 201)`

## Module Design

**Exports:**
- Named exports for utilities and types
- Default export not used
- Type exports: `export type App = typeof app`

**Route Modules:**
- Each route file creates own Hono instance
- Export the instance for mounting
- Example: `apps/api/src/routes/users.ts` exports `users` Hono app

---

*Convention analysis: 2026-02-05*
*Update when patterns change*
