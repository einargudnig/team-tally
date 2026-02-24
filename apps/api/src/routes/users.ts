import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { createError, ErrorCodes, generateId } from "../lib/utils.js";

// Zod schemas for validation
const userParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const users = new Hono()
  // All user routes require authentication
  .use("/*", authMiddleware)

  // GET /api/users - List all users (limited info)
  // NOTE: In production, you might want to restrict this or paginate
  .get("/", async (c) => {
    try {
      const allUsers = await db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      return c.json({ users: allUsers });
    } catch (error) {
      console.error("Error fetching users:", error);
      return c.json(
        createError("Failed to fetch users", ErrorCodes.DATABASE_ERROR),
        500
      );
    }
  })

  // GET /api/users/:id - Get single user
  .get("/:id", zValidator("param", userParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, id),
        columns: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        return c.json(
          createError("User not found", ErrorCodes.NOT_FOUND),
          404
        );
      }

      return c.json({ user });
    } catch (error) {
      console.error("Error fetching user:", error);
      return c.json(
        createError("Failed to fetch user", ErrorCodes.DATABASE_ERROR),
        500
      );
    }
  })

  // PUT /api/users/:id - Update user (only own profile)
  .put(
    "/:id",
    zValidator("param", userParamSchema),
    zValidator("json", updateUserSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      const currentUser = c.get("user");

      // Users can only update their own profile
      if (currentUser.id !== id) {
        return c.json(
          createError("Cannot update other users", ErrorCodes.FORBIDDEN),
          403
        );
      }

      try {
        const [updatedUser] = await db
          .update(schema.users)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, id))
          .returning({
            id: schema.users.id,
            name: schema.users.name,
            email: schema.users.email,
          });

        if (!updatedUser) {
          return c.json(
            createError("User not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        return c.json({
          message: "User updated",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        return c.json(
          createError("Failed to update user", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // DELETE /api/users/:id - Delete user (only own account)
  .delete("/:id", zValidator("param", userParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const currentUser = c.get("user");

    // Users can only delete their own account
    if (currentUser.id !== id) {
      return c.json(
        createError("Cannot delete other users", ErrorCodes.FORBIDDEN),
        403
      );
    }

    try {
      const deleted = await db
        .delete(schema.users)
        .where(eq(schema.users.id, id))
        .returning({ id: schema.users.id });

      if (deleted.length === 0) {
        return c.json(
          createError("User not found", ErrorCodes.NOT_FOUND),
          404
        );
      }

      return c.json({ message: "User deleted" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return c.json(
        createError("Failed to delete user", ErrorCodes.DATABASE_ERROR),
        500
      );
    }
  });
