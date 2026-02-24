import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { eq, and, gte, lte, between } from "drizzle-orm";
import { authMiddleware, teamMemberMiddleware, teamAdminMiddleware } from "../middleware/auth.js";
import { createError, ErrorCodes, generateId, parseDate } from "../lib/utils.js";

// Validation schemas
const teamParamSchema = z.object({
  teamId: z.string().uuid("Invalid team ID format"),
});

const fineParamSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID format"),
});

const createFineSchema = z.object({
  name: z.string().min(2, "Fine name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  fineDate: z.string().refine((val) => parseDate(val) !== null, {
    message: "Invalid date format. Use ISO 8601 (YYYY-MM-DD)",
  }),
});

const updateFineSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number().positive().nullable().optional(),
  fineDate: z.string().refine((val) => parseDate(val) !== null, {
    message: "Invalid date format",
  }).optional(),
});

const dateFilterSchema = z.object({
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const fines = new Hono()
  // All fine routes require authentication
  .use("/*", authMiddleware)

  // GET /api/teams/:teamId/fines - List fines for a team
  .get(
    "/teams/:teamId/fines",
    zValidator("param", teamParamSchema),
    zValidator("query", dateFilterSchema),
    teamMemberMiddleware,
    async (c) => {
      const { teamId } = c.req.valid("param");
      const { date, startDate, endDate } = c.req.valid("query");

      try {
        let whereConditions = [eq(schema.fines.teamId, teamId)];

        // Apply date filters
        if (date) {
          const targetDate = parseDate(date);
          if (targetDate) {
            // For single date, match the entire day
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            whereConditions.push(gte(schema.fines.fineDate, startOfDay));
            whereConditions.push(lte(schema.fines.fineDate, endOfDay));
          }
        } else if (startDate && endDate) {
          const start = parseDate(startDate);
          const end = parseDate(endDate);
          if (start && end) {
            whereConditions.push(gte(schema.fines.fineDate, start));
            whereConditions.push(lte(schema.fines.fineDate, end));
          }
        }

        const teamFines = await db.query.fines.findMany({
          where: and(...whereConditions),
          with: {
            creator: {
              columns: {
                id: true,
                name: true,
              },
            },
            allocations: {
              with: {
                member: {
                  with: {
                    user: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: (fines, { desc }) => [desc(fines.fineDate)],
        });

        return c.json({ fines: teamFines });
      } catch (error) {
        console.error("Error fetching fines:", error);
        return c.json(
          createError("Failed to fetch fines", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // POST /api/teams/:teamId/fines - Create a fine
  .post(
    "/teams/:teamId/fines",
    zValidator("param", teamParamSchema),
    zValidator("json", createFineSchema),
    teamMemberMiddleware,
    teamAdminMiddleware,
    async (c) => {
      const { teamId } = c.req.valid("param");
      const { name, description, amount, fineDate } = c.req.valid("json");
      const userId = c.get("userId");

      try {
        const [fine] = await db.insert(schema.fines).values({
          id: generateId(),
          teamId,
          name,
          description,
          amount,
          fineDate: parseDate(fineDate)!,
          createdBy: userId,
        }).returning();

        return c.json(
          {
            message: "Fine created",
            fine,
          },
          201
        );
      } catch (error) {
        console.error("Error creating fine:", error);
        return c.json(
          createError("Failed to create fine", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // GET /api/fines/:fineId - Get fine details
  .get(
    "/:fineId",
    zValidator("param", fineParamSchema),
    async (c) => {
      const { fineId } = c.req.valid("param");
      const userId = c.get("userId");

      try {
        const fine = await db.query.fines.findFirst({
          where: eq(schema.fines.id, fineId),
          with: {
            team: true,
            creator: {
              columns: {
                id: true,
                name: true,
              },
            },
            allocations: {
              with: {
                member: {
                  with: {
                    user: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                allocator: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!fine) {
          return c.json(
            createError("Fine not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Verify user is a member of the team
        const membership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, fine.teamId),
            eq(schema.teamMembers.userId, userId)
          ),
        });

        if (!membership) {
          return c.json(
            createError("Not a member of this team", ErrorCodes.FORBIDDEN),
            403
          );
        }

        return c.json({ fine });
      } catch (error) {
        console.error("Error fetching fine:", error);
        return c.json(
          createError("Failed to fetch fine", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // PUT /api/fines/:fineId - Update fine
  .put(
    "/:fineId",
    zValidator("param", fineParamSchema),
    zValidator("json", updateFineSchema),
    async (c) => {
      const { fineId } = c.req.valid("param");
      const body = c.req.valid("json");
      const userId = c.get("userId");

      try {
        // Get the fine and verify access
        const fine = await db.query.fines.findFirst({
          where: eq(schema.fines.id, fineId),
        });

        if (!fine) {
          return c.json(
            createError("Fine not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Verify user is admin of the team
        const membership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, fine.teamId),
            eq(schema.teamMembers.userId, userId),
            eq(schema.teamMembers.role, "admin")
          ),
        });

        if (!membership) {
          return c.json(
            createError("Admin access required", ErrorCodes.FORBIDDEN),
            403
          );
        }

        const updateData: Record<string, any> = {
          updatedAt: new Date(),
        };

        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.amount !== undefined) updateData.amount = body.amount;
        if (body.fineDate !== undefined) updateData.fineDate = parseDate(body.fineDate);

        const [updatedFine] = await db
          .update(schema.fines)
          .set(updateData)
          .where(eq(schema.fines.id, fineId))
          .returning();

        return c.json({
          message: "Fine updated",
          fine: updatedFine,
        });
      } catch (error) {
        console.error("Error updating fine:", error);
        return c.json(
          createError("Failed to update fine", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // DELETE /api/fines/:fineId - Delete fine
  .delete(
    "/:fineId",
    zValidator("param", fineParamSchema),
    async (c) => {
      const { fineId } = c.req.valid("param");
      const userId = c.get("userId");

      try {
        // Get the fine and verify access
        const fine = await db.query.fines.findFirst({
          where: eq(schema.fines.id, fineId),
        });

        if (!fine) {
          return c.json(
            createError("Fine not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Verify user is admin of the team
        const membership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, fine.teamId),
            eq(schema.teamMembers.userId, userId),
            eq(schema.teamMembers.role, "admin")
          ),
        });

        if (!membership) {
          return c.json(
            createError("Admin access required", ErrorCodes.FORBIDDEN),
            403
          );
        }

        // Cascading delete will remove allocations
        await db.delete(schema.fines).where(eq(schema.fines.id, fineId));

        return c.json({ message: "Fine deleted" });
      } catch (error) {
        console.error("Error deleting fine:", error);
        return c.json(
          createError("Failed to delete fine", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  );
