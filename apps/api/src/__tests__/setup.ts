/**
 * Test setup and utilities
 */
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../db/schema.js";
import { generateId } from "../lib/utils.js";
import { hashPassword, createSession } from "../lib/auth.js";

// Use in-memory database for tests
const testSqlite = new Database(":memory:");

// Initialize test database schema
testSqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  
  CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  
  CREATE TABLE team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    joined_at INTEGER NOT NULL
  );
  
  CREATE TABLE fines (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL,
    fine_date INTEGER NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  
  CREATE TABLE allocations (
    id TEXT PRIMARY KEY,
    fine_id TEXT NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 1 AND quantity <= 3),
    allocated_at INTEGER NOT NULL,
    allocated_by TEXT NOT NULL REFERENCES users(id)
  );
  
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  
  PRAGMA foreign_keys = ON;
`);

export const testDb = drizzle(testSqlite, { schema });

/**
 * Create a test user and return user with auth token
 */
export async function createTestUser(overrides: Partial<{
  name: string;
  email: string;
  password: string;
}> = {}) {
  const userId = generateId();
  const name = overrides.name || "Test User";
  const email = overrides.email || `test-${userId.slice(0, 8)}@example.com`;
  const password = overrides.password || "testpassword123";
  const passwordHash = await hashPassword(password);
  const now = new Date();

  // Insert user
  testSqlite.exec(`
    INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
    VALUES ('${userId}', '${name}', '${email}', '${passwordHash}', ${now.getTime()}, ${now.getTime()})
  `);

  // Create session
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sessionId = generateId();

  testSqlite.exec(`
    INSERT INTO sessions (id, user_id, token, expires_at, created_at)
    VALUES ('${sessionId}', '${userId}', '${token}', ${expiresAt.getTime()}, ${now.getTime()})
  `);

  return {
    user: { id: userId, name, email },
    token,
    password,
  };
}

/**
 * Create a test team with the user as admin
 */
export function createTestTeam(userId: string, overrides: Partial<{
  name: string;
  description: string;
}> = {}) {
  const teamId = generateId();
  const memberId = generateId();
  const name = overrides.name || "Test Team";
  const description = overrides.description || "A test team";
  const now = new Date();

  testSqlite.exec(`
    INSERT INTO teams (id, name, description, created_by, created_at, updated_at)
    VALUES ('${teamId}', '${name}', '${description}', '${userId}', ${now.getTime()}, ${now.getTime()})
  `);

  testSqlite.exec(`
    INSERT INTO team_members (id, team_id, user_id, role, joined_at)
    VALUES ('${memberId}', '${teamId}', '${userId}', 'admin', ${now.getTime()})
  `);

  return { teamId, memberId, name, description };
}

/**
 * Create a test fine
 */
export function createTestFine(teamId: string, createdBy: string, overrides: Partial<{
  name: string;
  description: string;
  amount: number;
  fineDate: Date;
}> = {}) {
  const fineId = generateId();
  const name = overrides.name || "Test Fine";
  const description = overrides.description || "A test fine";
  const amount = overrides.amount || 10;
  const fineDate = overrides.fineDate || new Date();
  const now = new Date();

  testSqlite.exec(`
    INSERT INTO fines (id, team_id, name, description, amount, fine_date, created_by, created_at, updated_at)
    VALUES ('${fineId}', '${teamId}', '${name}', '${description}', ${amount}, ${fineDate.getTime()}, '${createdBy}', ${now.getTime()}, ${now.getTime()})
  `);

  return { fineId, name, description, amount, fineDate };
}

/**
 * Clean up test database
 */
export function cleanupTestDb() {
  testSqlite.exec(`
    DELETE FROM allocations;
    DELETE FROM fines;
    DELETE FROM team_members;
    DELETE FROM teams;
    DELETE FROM sessions;
    DELETE FROM users;
  `);
}

/**
 * Helper to make authenticated requests
 */
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
