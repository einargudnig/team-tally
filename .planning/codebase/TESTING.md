# Testing Patterns

**Analysis Date:** 2026-02-05

## Test Framework

**Runner:**
- Bun test (specified in `CLAUDE.md`)
- No tests currently implemented

**Assertion Library:**
- Bun built-in `expect`
- Matchers: `toBe`, `toEqual`, `toThrow`

**Run Commands:**
```bash
bun test                              # Run all tests
bun test --watch                      # Watch mode
bun test path/to/file.test.ts        # Single file
```

## Test File Organization

**Location:**
- Co-located with source files (recommended pattern)
- No test files exist yet

**Naming:**
- `*.test.ts` for test files
- Match source file name: `users.test.ts` for `users.ts`

**Expected Structure:**
```
apps/api/src/
  routes/
    users.ts
    users.test.ts      # Co-located test
  lib/
    auth.ts
    auth.test.ts       # Co-located test
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect, describe, beforeEach } from "bun:test"

describe("ModuleName", () => {
  describe("functionName", () => {
    beforeEach(() => {
      // reset state
    })

    test("should handle valid input", () => {
      // arrange
      const input = { name: "Test", email: "test@example.com" }

      // act
      const result = functionName(input)

      // assert
      expect(result).toEqual(expectedOutput)
    })

    test("should throw on invalid input", () => {
      expect(() => functionName(null)).toThrow("error message")
    })
  })
})
```

**Patterns:**
- Use `beforeEach` for per-test setup
- Arrange/Act/Assert structure
- One assertion focus per test

## Mocking

**Framework:**
- Bun built-in mocking (when implemented)
- `mock()` function for module mocking

**What to Mock:**
- External API calls
- Database operations
- Environment variables
- File system operations

**What NOT to Mock:**
- Pure functions
- Zod schemas
- Internal utilities

## Fixtures and Factories

**Test Data:**
```typescript
// Factory pattern (recommended)
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: "test-id",
    name: "Test User",
    email: "test@example.com",
    ...overrides
  }
}
```

**Location:**
- Factory functions in test file when simple
- Shared fixtures in `tests/fixtures/` when complex

## Coverage

**Requirements:**
- No coverage target established
- Coverage tracked for awareness

**Configuration:**
- Bun has built-in coverage support
- Not yet configured

**View Coverage:**
```bash
bun test --coverage
```

## Test Types

**Unit Tests:**
- Test single function in isolation
- Mock external dependencies
- Target: Route handlers, utilities, validation

**Integration Tests:**
- Test API endpoints end-to-end
- Use test HTTP client
- Target: Full request/response cycle

**E2E Tests:**
- Not planned yet
- Would test full user flows

## Common Patterns

**Async Testing:**
```typescript
test("should handle async operation", async () => {
  const result = await asyncFunction()
  expect(result).toBe("expected")
})
```

**Error Testing:**
```typescript
test("should throw on invalid input", () => {
  expect(() => parse(null)).toThrow("Cannot parse null")
})

// Async error
test("should reject on failure", async () => {
  await expect(asyncCall()).rejects.toThrow("error message")
})
```

**API Route Testing:**
```typescript
import { app } from "../index"

test("GET /api/users returns users", async () => {
  const response = await app.request("/api/users")
  expect(response.status).toBe(200)

  const data = await response.json()
  expect(data.users).toBeInstanceOf(Array)
})
```

**Snapshot Testing:**
- Not used in this codebase
- Prefer explicit assertions

## Validation Testing

**Zod Schema Testing:**
```typescript
import { createUserSchema } from "./users"

test("createUserSchema validates email", () => {
  const result = createUserSchema.safeParse({
    name: "Test",
    email: "invalid"
  })
  expect(result.success).toBe(false)
})
```

---

*Testing analysis: 2026-02-05*
*Update when test patterns change*
