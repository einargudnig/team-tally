import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware, teamMemberMiddleware, teamAdminMiddleware } from "../middleware/auth.js";
import { createError, ErrorCodes, generateId } from "../lib/utils.js";

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

const teamParamSchema = z.object({
  teamId: z.string().uuid("Invalid team ID format"),
});

export const teams = new Hono()
  // All team routes require authentication
  .use("/*", authMiddleware)

  // GET /api/teams - List user's teams
  .get("/", async (c) => {
    const userId = c.get("userId");

    try {
      // Get all teams where user is a member
      const memberships = await db.query.teamMembers.findMany({
        where: eq(schema.teamMembers.userId, userId),
        with: {
          team: true,
        },
      });

      const teamsWithRole = memberships.map((m) => ({
        ...m.team,
        role: m.role,
        joinedAt: m.joinedAt,
      }));

      return c.json({ teams: teamsWithRole });
    } catch (error) {
      console.error("Error fetching teams:", error);
      return c.json(
        createError("Failed to fetch teams", ErrorCodes.DATABASE_ERROR),
        500
      );
    }
  })

  // POST /api/teams - Create a new team
  .post("/", zValidator("json", createTeamSchema), async (c) => {
    const { name, description } = c.req.valid("json");
    const userId = c.get("userId");

    try {
      const teamId = generateId();
      const memberId = generateId();

      // Create team and add creator as admin in a transaction
      const [team] = await db.insert(schema.teams).values({
        id: teamId,
        name,
        description,
        createdBy: userId,
      }).returning();

      // Add creator as admin member
      await db.insert(schema.teamMembers).values({
        id: memberId,
        teamId,
        userId,
        role: "admin",
      });

      return c.json(
        {
          message: "Team created",
          team: {
            ...team,
            role: "admin",
          },
        },
        201
      );
    } catch (error) {
      console.error("Error creating team:", error);
      return c.json(
        createError("Failed to create team", ErrorCodes.DATABASE_ERROR),
        500
      );
    }
  })

  // GET /api/teams/:teamId - Get team details
  .get(
    "/:teamId",
    zValidator("param", teamParamSchema),
    async (c, next) => {
      // Inline member check to get team even if not member (for public info)
      const userId = c.get("userId");
      const { teamId } = c.req.valid("param");

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

      c.set("teamMembership" as any, membership);
      return next();
    },
    async (c) => {
      const { teamId } = c.req.valid("param");

      try {
        const team = await db.query.teams.findFirst({
          where: eq(schema.teams.id, teamId),
          with: {
            members: {
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
            creator: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!team) {
          return c.json(
            createError("Team not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        return c.json({ team });
      } catch (error) {
        console.error("Error fetching team:", error);
        return c.json(
          createError("Failed to fetch team", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // PUT /api/teams/:teamId - Update team (admin only)
  .put(
    "/:teamId",
    zValidator("param", teamParamSchema),
    zValidator("json", updateTeamSchema),
    teamMemberMiddleware,
    teamAdminMiddleware,
    async (c) => {
      const { teamId } = c.req.valid("param");
      const body = c.req.valid("json");

      try {
        const [updatedTeam] = await db
          .update(schema.teams)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(eq(schema.teams.id, teamId))
          .returning();

        if (!updatedTeam) {
          return c.json(
            createError("Team not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        return c.json({
          message: "Team updated",
          team: updatedTeam,
        });
      } catch (error) {
        console.error("Error updating team:", error);
        return c.json(
          createError("Failed to update team", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  )

  // DELETE /api/teams/:teamId - Delete team (admin only)
  .delete(
    "/:teamId",
    zValidator("param", teamParamSchema),
    teamMemberMiddleware,
    teamAdminMiddleware,
    async (c) => {
      const { teamId } = c.req.valid("param");

      try {
        // Cascading delete will remove members, fines, and allocations
        const deleted = await db
          .delete(schema.teams)
          .where(eq(schema.teams.id, teamId))
          .returning({ id: schema.teams.id });

        if (deleted.length === 0) {
          return c.json(
            createError("Team not found", ErrorCodes.NOT_FOUND),
            404
          );
        }

        return c.json({ message: "Team deleted" });
      } catch (error) {
        console.error("Error deleting team:", error);
        return c.json(
          createError("Failed to delete team", ErrorCodes.DATABASE_ERROR),
          500
        );
      }
    }
  );
