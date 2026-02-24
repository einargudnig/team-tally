import { Context, Next } from "hono";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { createError, ErrorCodes } from "../lib/utils.js";

/**
 * User context added by auth middleware
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Extended context with authenticated user
 */
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
    userId: string;
  }
}

/**
 * Authentication middleware - validates session token
 * Expects Authorization header: Bearer <token>
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      createError("Missing or invalid authorization header", ErrorCodes.UNAUTHORIZED),
      401
    );
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    // Look up session by token
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.token, token),
      ),
      with: {
        user: true,
      },
    });

    if (!session) {
      return c.json(
        createError("Invalid or expired session", ErrorCodes.INVALID_TOKEN),
        401
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id));
      return c.json(
        createError("Session expired", ErrorCodes.INVALID_TOKEN),
        401
      );
    }

    // Set user in context
    c.set("user", {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });
    c.set("userId", session.user.id);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json(
      createError("Authentication failed", ErrorCodes.INTERNAL_ERROR),
      500
    );
  }
}

/**
 * Team membership check - ensures user is a member of the team
 * Must be used after authMiddleware
 * Expects :teamId in route params
 */
export async function teamMemberMiddleware(c: Context, next: Next) {
  const userId = c.get("userId");
  const teamId = c.req.param("teamId");

  if (!teamId) {
    return c.json(
      createError("Team ID required", ErrorCodes.VALIDATION_ERROR),
      400
    );
  }

  try {
    const membership = await db.query.teamMembers.findFirst({
      where: and(
        eq(schema.teamMembers.teamId, teamId),
        eq(schema.teamMembers.userId, userId)
      ),
    });

    if (!membership) {
      return c.json(
        createError("Not a member of this team", ErrorCodes.FORBIDDEN),
        403
      );
    }

    // Add membership info to context for role checks
    c.set("teamMembership" as any, membership);

    await next();
  } catch (error) {
    console.error("Team member middleware error:", error);
    return c.json(
      createError("Failed to verify team membership", ErrorCodes.INTERNAL_ERROR),
      500
    );
  }
}

/**
 * Team admin check - ensures user is an admin of the team
 * Must be used after teamMemberMiddleware
 */
export async function teamAdminMiddleware(c: Context, next: Next) {
  const membership = c.get("teamMembership" as any);

  if (!membership || membership.role !== "admin") {
    return c.json(
      createError("Admin access required", ErrorCodes.FORBIDDEN),
      403
    );
  }

  await next();
}

/**
 * Optional auth middleware - sets user if authenticated, but doesn't require it
 * Useful for endpoints that behave differently for authenticated users
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    try {
      const session = await db.query.sessions.findFirst({
        where: and(
          eq(schema.sessions.token, token),
        ),
        with: {
          user: true,
        },
      });

      if (session && session.expiresAt >= new Date()) {
        c.set("user", {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        });
        c.set("userId", session.user.id);
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      console.warn("Optional auth check failed:", error);
    }
  }

  await next();
}
