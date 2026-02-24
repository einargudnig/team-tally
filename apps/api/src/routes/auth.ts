import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { registerUser, loginUser, invalidateSession } from "../lib/auth.js";
import { createError, ErrorCodes } from "../lib/utils.js";
import { authMiddleware } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rate-limit.js";

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const auth = new Hono()
  // Apply rate limiting to all auth routes
  .use("/*", authRateLimit)

  // POST /api/auth/register - Register a new user
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { name, email, password } = c.req.valid("json");

    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });

      if (existingUser) {
        return c.json(
          createError("Email already registered", ErrorCodes.ALREADY_EXISTS),
          409
        );
      }

      const { user, session } = await registerUser(name, email, password);

      return c.json(
        {
          message: "Registration successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token: session.token,
          expiresAt: session.expiresAt.toISOString(),
        },
        201
      );
    } catch (error) {
      console.error("Registration error:", error);
      return c.json(
        createError("Registration failed", ErrorCodes.INTERNAL_ERROR),
        500
      );
    }
  })

  // POST /api/auth/login - Login user
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const result = await loginUser(email, password);

      if (!result) {
        return c.json(
          createError("Invalid email or password", ErrorCodes.UNAUTHORIZED),
          401
        );
      }

      const { user, session } = result;

      return c.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (error) {
      console.error("Login error:", error);
      return c.json(
        createError("Login failed", ErrorCodes.INTERNAL_ERROR),
        500
      );
    }
  })

  // POST /api/auth/logout - Logout user
  .post("/logout", authMiddleware, async (c) => {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.slice(7); // Remove "Bearer "

    if (token) {
      try {
        await invalidateSession(token);
      } catch (error) {
        console.error("Logout error:", error);
        // Still return success - user wanted to logout anyway
      }
    }

    return c.json({ message: "Logged out successfully" });
  })

  // GET /api/auth/me - Get current user
  .get("/me", authMiddleware, async (c) => {
    const user = c.get("user");
    return c.json({ user });
  });
