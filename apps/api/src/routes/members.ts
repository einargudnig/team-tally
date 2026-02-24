import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware, teamMemberMiddleware, teamAdminMiddleware } from "../middleware/auth.js";
import { createError, ErrorCodes, generateId } from "../lib/utils.js";

// Validation schemas
const teamParamSchema = z.object({
  teamId: z.string().uuid("Invalid team ID format"),
});

const memberParamSchema = z.object({
  teamId: z.string().uuid("Invalid team ID format"),
  memberId: z.string().uuid("Invalid member ID format"),
});

const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

const updateMemberSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export const members = new Hono()
  // All member routes require authentication
  .use("/*", authMiddleware)

  // GET /api/teams/:teamId/members - List team members
  .get(
    "/:teamId/members",
    zValidator("param", teamParamSchema),
    teamMemberMiddleware,
    async (c) => {
      const { teamId } = c.req.valid("param");

      try {
        const teamMembers = await db.query.teamMembers.findMany({
          where: eq(schema.teamMembers.teamId, teamId),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        const members = teamMembers.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          user: m.user,
        }));

        return c.json({ members });
      } catch (error) {
        console.error("Error fetching members:", error);
        return c.json(
          createError("Failed to fetch members", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // POST /api/teams/:teamId/members - Add member to team (admin only)
  .post(
    "/:teamId/members",
    zValidator("param", teamParamSchema),
    zValidator("json", addMemberSchema),
    teamMemberMiddleware,
    teamAdminMiddleware,
    async (c) => {
      const { teamId } = c.req.valid("param");
      const { email, role } = c.req.valid("json");

      try {
        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(schema.users.email, email),
        });

        if (!user) {
          return c.json(
            createError("User not found with this email", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Check if already a member
        const existingMembership = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.teamId, teamId),
            eq(schema.teamMembers.userId, user.id)
          ),
        });

        if (existingMembership) {
          return c.json(
            createError("User is already a member of this team", ErrorCodes.ALREADY_EXISTS),
            409
          );
        }

        // Add member
        const [member] = await db.insert(schema.teamMembers).values({
          id: generateId(),
          teamId,
          userId: user.id,
          role,
        }).returning();

        return c.json(
          {
            message: "Member added",
            member: {
              id: member.id,
              userId: user.id,
              role: member.role,
              joinedAt: member.joinedAt,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
              },
            },
          },
          201
        );
      } catch (error) {
        console.error("Error adding member:", error);
        return c.json(
          createError("Failed to add member", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // PUT /api/teams/:teamId/members/:memberId - Update member role (admin only)
  .put(
    "/:teamId/members/:memberId",
    zValidator("param", memberParamSchema),
    zValidator("json", updateMemberSchema),
    teamMemberMiddleware,
    teamAdminMiddleware,
    async (c) => {
      const { teamId, memberId } = c.req.valid("param");
      const { role } = c.req.valid("json");
      const currentUserId = c.get("userId");

      try {
        // Get the member being updated
        const member = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.id, memberId),
            eq(schema.teamMembers.teamId, teamId)
          ),
        });

        if (!member) {
          return c.json(
            createError("Member not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Prevent demoting yourself if you're the last admin
        if (member.userId === currentUserId && role === "member") {
          const adminCount = await db.query.teamMembers.findMany({
            where: and(
              eq(schema.teamMembers.teamId, teamId),
              eq(schema.teamMembers.role, "admin")
            ),
          });

          if (adminCount.length <= 1) {
            return c.json(
              createError("Cannot demote the last admin", ErrorCodes.VALIDATION_ERROR),
              400
            );
          }
        }

        const [updatedMember] = await db
          .update(schema.teamMembers)
          .set({ role })
          .where(eq(schema.teamMembers.id, memberId))
          .returning();

        return c.json({
          message: "Member updated",
          member: updatedMember,
        });
      } catch (error) {
        console.error("Error updating member:", error);
        return c.json(
          createError("Failed to update member", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // DELETE /api/teams/:teamId/members/:memberId - Remove member (admin only, or self)
  .delete(
    "/:teamId/members/:memberId",
    zValidator("param", memberParamSchema),
    teamMemberMiddleware,
    async (c) => {
      const { teamId, memberId } = c.req.valid("param");
      const currentUserId = c.get("userId");
      const currentMembership = c.get("teamMembership" as any);

      try {
        // Get the member being removed
        const member = await db.query.teamMembers.findFirst({
          where: and(
            eq(schema.teamMembers.id, memberId),
            eq(schema.teamMembers.teamId, teamId)
          ),
        });

        if (!member) {
          return c.json(
            createError("Member not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        // Check permissions: must be admin OR removing self
        const isAdmin = currentMembership.role === "admin";
        const isSelf = member.userId === currentUserId;

        if (!isAdmin && !isSelf) {
          return c.json(
            createError("Admin access required to remove other members", ErrorCodes.FORBIDDEN),
            403
          );
        }

        // Prevent removing the last admin
        if (member.role === "admin") {
          const adminCount = await db.query.teamMembers.findMany({
            where: and(
              eq(schema.teamMembers.teamId, teamId),
              eq(schema.teamMembers.role, "admin")
            ),
          });

          if (adminCount.length <= 1) {
            return c.json(
              createError("Cannot remove the last admin. Delete the team instead.", ErrorCodes.VALIDATION_ERROR),
              400
            );
          }
        }

        await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, memberId));

        return c.json({ message: "Member removed" });
      } catch (error) {
        console.error("Error removing member:", error);
        return c.json(
          createError("Failed to remove member", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  );
