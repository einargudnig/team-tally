import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import { createError, ErrorCodes, generateId } from "../lib/utils.js";

// Validation schemas
const fineParamSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID format"),
});

const allocationParamSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation ID format"),
});

const createAllocationSchema = z.object({
  memberId: z.string().uuid("Invalid member ID format"),
  quantity: z.number().int().min(1).max(3, "Quantity must be between 1 and 3"),
});

const bulkAllocateSchema = z.object({
  allocations: z.array(
    z.object({
      memberId: z.string().uuid("Invalid member ID format"),
      quantity: z.number().int().min(1).max(3, "Quantity must be between 1 and 3"),
    })
  ).min(1, "At least one allocation required"),
});

const updateAllocationSchema = z.object({
  quantity: z.number().int().min(1).max(3, "Quantity must be between 1 and 3"),
});

export const allocations = new Hono()
  // All allocation routes require authentication
  .use("/*", authMiddleware)

  // GET /api/fines/:fineId/allocations - List allocations for a fine
  .get(
    "/fines/:fineId/allocations",
    zValidator("param", fineParamSchema),
    async (c) => {
      const { fineId } = c.req.valid("param");
      const userId = c.get("userId");

      try {
        // Get fine and verify access
        const fine = await db.query.fines.findFirst({
          where: eq(schema.fines.id, fineId),
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

        const fineAllocations = await db.query.allocations.findMany({
          where: eq(schema.allocations.fineId, fineId),
          with: {
            member: {
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
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
        });

        return c.json({ allocations: fineAllocations });
      } catch (error) {
        console.error("Error fetching allocations:", error);
        return c.json(
          createError("Failed to fetch allocations", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // POST /api/fines/:fineId/allocations - Allocate fine to member(s)
  .post(
    "/fines/:fineId/allocations",
    zValidator("param", fineParamSchema),
    zValidator("json", createAllocationSchema),
    async (c) => {
      const { fineId } = c.req.valid("param");
      const { memberId, quantity } = c.req.valid("json");
      const userId = c.get("userId");

      try {
        // Get fine and verify access
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

        // Verify target member exists and belongs to the team
        const targetMember = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.id, memberId),
            eq(schema.teamMembers.teamId, fine.teamId)
          ),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!targetMember) {
          return c.json(
            createError("Member not found in this team", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Check if already allocated to this member
        const existingAllocation = await db.query.allocations.findFirst({
          where: and(
            eq(schema.allocations.fineId, fineId),
            eq(schema.allocations.memberId, memberId)
          ),
        });

        if (existingAllocation) {
          return c.json(
            createError("Fine already allocated to this member. Update the existing allocation instead.", ErrorCodes.ALREADY_EXISTS),
            409
          );
        }

        const [allocation] = await db.insert(schema.allocations).values({
          id: generateId(),
          fineId,
          memberId,
          quantity,
          allocatedBy: userId,
        }).returning();

        return c.json(
          {
            message: "Fine allocated",
            allocation: {
              ...allocation,
              member: targetMember,
            },
          },
          201
        );
      } catch (error) {
        console.error("Error creating allocation:", error);
        return c.json(
          createError("Failed to allocate fine", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // POST /api/fines/:fineId/allocations/bulk - Bulk allocate fine to multiple members
  .post(
    "/fines/:fineId/allocations/bulk",
    zValidator("param", fineParamSchema),
    zValidator("json", bulkAllocateSchema),
    async (c) => {
      const { fineId } = c.req.valid("param");
      const { allocations: allocationRequests } = c.req.valid("json");
      const userId = c.get("userId");

      try {
        // Get fine and verify access
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

        // Verify all members exist and belong to the team
        const memberIds = allocationRequests.map((a) => a.memberId);
        const teamMembers = await db.query.teamMembers.findMany({
          where: eq(schema.teamMembers.teamId, fine.teamId),
        });

        const validMemberIds = new Set(teamMembers.map((m) => m.id));
        const invalidMembers = memberIds.filter((id) => !validMemberIds.has(id));

        if (invalidMembers.length > 0) {
          return c.json(
            createError(`Invalid member IDs: ${invalidMembers.join(", ")}`, ErrorCodes.VALIDATION_ERROR),
            400
          );
        }

        // Create allocations
        const newAllocations = await db.insert(schema.allocations).values(
          allocationRequests.map((a) => ({
            id: generateId(),
            fineId,
            memberId: a.memberId,
            quantity: a.quantity,
            allocatedBy: userId,
          }))
        ).returning();

        return c.json(
          {
            message: `${newAllocations.length} allocations created`,
            allocations: newAllocations,
          },
          201
        );
      } catch (error) {
        console.error("Error creating bulk allocations:", error);
        return c.json(
          createError("Failed to allocate fines", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // GET /api/allocations/:allocationId - Get allocation details
  .get(
    "/:allocationId",
    zValidator("param", allocationParamSchema),
    async (c) => {
      const { allocationId } = c.req.valid("param");
      const userId = c.get("userId");

      try {
        const allocation = await db.query.allocations.findFirst({
          where: eq(schema.allocations.id, allocationId),
          with: {
            fine: {
              with: {
                team: true,
              },
            },
            member: {
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
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
        });

        if (!allocation) {
          return c.json(
            createError("Allocation not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Verify user is a member of the team
        const membership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, allocation.fine.teamId),
            eq(schema.teamMembers.userId, userId)
          ),
        });

        if (!membership) {
          return c.json(
            createError("Not a member of this team", ErrorCodes.FORBIDDEN),
            403
          );
        }

        return c.json({ allocation });
      } catch (error) {
        console.error("Error fetching allocation:", error);
        return c.json(
          createError("Failed to fetch allocation", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // PUT /api/allocations/:allocationId - Update allocation quantity
  .put(
    "/:allocationId",
    zValidator("param", allocationParamSchema),
    zValidator("json", updateAllocationSchema),
    async (c) => {
      const { allocationId } = c.req.valid("param");
      const { quantity } = c.req.valid("json");
      const userId = c.get("userId");

      try {
        const allocation = await db.query.allocations.findFirst({
          where: eq(schema.allocations.id, allocationId),
          with: {
            fine: true,
          },
        });

        if (!allocation) {
          return c.json(
            createError("Allocation not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Verify user is admin of the team
        const membership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, allocation.fine.teamId),
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

        const [updatedAllocation] = await db
          .update(schema.allocations)
          .set({ quantity })
          .where(eq(schema.allocations.id, allocationId))
          .returning();

        return c.json({
          message: "Allocation updated",
          allocation: updatedAllocation,
        });
      } catch (error) {
        console.error("Error updating allocation:", error);
        return c.json(
          createError("Failed to update allocation", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // DELETE /api/allocations/:allocationId - Remove allocation
  .delete(
    "/:allocationId",
    zValidator("param", allocationParamSchema),
    async (c) => {
      const { allocationId } = c.req.valid("param");
      const userId = c.get("userId");

      try {
        const allocation = await db.query.allocations.findFirst({
          where: eq(schema.allocations.id, allocationId),
          with: {
            fine: true,
          },
        });

        if (!allocation) {
          return c.json(
            createError("Allocation not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Verify user is admin of the team
        const membership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, allocation.fine.teamId),
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

        await db.delete(schema.allocations).where(eq(schema.allocations.id, allocationId));

        return c.json({ message: "Allocation removed" });
      } catch (error) {
        console.error("Error removing allocation:", error);
        return c.json(
          createError("Failed to remove allocation", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  );
