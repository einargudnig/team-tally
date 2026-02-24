import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { generateId } from "./utils.js";
import { env } from "./env.js";

/**
 * Authentication utilities
 */

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Hash a password using Bun's built-in password hashing
 * Uses bcrypt under the hood
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(schema.sessions).values({
    id: generateId(),
    userId,
    token,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Invalidate a session by token
 */
export async function invalidateSession(token: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/**
 * Clean up expired sessions
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  const result = await db
    .delete(schema.sessions)
    .where(eq(schema.sessions.expiresAt, now)); // This needs a proper comparison
  
  // Note: Drizzle doesn't return affected rows count easily for SQLite
  // In production, you might want to log this differently
  return 0;
}

/**
 * Register a new user
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ user: typeof schema.users.$inferSelect; session: { token: string; expiresAt: Date } }> {
  const passwordHash = await hashPassword(password);
  const userId = generateId();

  const [user] = await db
    .insert(schema.users)
    .values({
      id: userId,
      name,
      email,
      passwordHash,
    })
    .returning();

  const session = await createSession(userId);

  return { user, session };
}

/**
 * Login a user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: typeof schema.users.$inferSelect; session: { token: string; expiresAt: Date } } | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  const session = await createSession(user.id);

  return { user, session };
}
