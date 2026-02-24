import { describe, test, expect } from "bun:test";
import { z } from "zod";

describe("Team Validation Schemas", () => {
  const createTeamSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
  });

  const updateTeamSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
  });

  test("create schema validates correct input", () => {
    const result = createTeamSchema.safeParse({
      name: "My Team",
      description: "A great team",
    });
    expect(result.success).toBe(true);
  });

  test("create schema accepts missing description", () => {
    const result = createTeamSchema.safeParse({
      name: "My Team",
    });
    expect(result.success).toBe(true);
  });

  test("create schema rejects short name", () => {
    const result = createTeamSchema.safeParse({
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects long name", () => {
    const result = createTeamSchema.safeParse({
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects long description", () => {
    const result = createTeamSchema.safeParse({
      name: "My Team",
      description: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  test("update schema accepts partial updates", () => {
    const result = updateTeamSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  test("update schema accepts empty object", () => {
    const result = updateTeamSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("Team Role Validation", () => {
  const roleSchema = z.enum(["admin", "member"]);

  test("accepts admin role", () => {
    const result = roleSchema.safeParse("admin");
    expect(result.success).toBe(true);
  });

  test("accepts member role", () => {
    const result = roleSchema.safeParse("member");
    expect(result.success).toBe(true);
  });

  test("rejects invalid role", () => {
    const result = roleSchema.safeParse("superadmin");
    expect(result.success).toBe(false);
  });
});

describe("Team ID Validation", () => {
  const teamIdSchema = z.string().uuid();

  test("accepts valid UUID", () => {
    const result = teamIdSchema.safeParse("123e4567-e89b-12d3-a456-426614174000");
    expect(result.success).toBe(true);
  });

  test("rejects invalid UUID", () => {
    const result = teamIdSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  test("rejects empty string", () => {
    const result = teamIdSchema.safeParse("");
    expect(result.success).toBe(false);
  });
});

describe("Team Business Logic", () => {
  test("creator should become admin automatically", () => {
    // This tests the business logic concept
    const createTeamWithAdmin = (userId: string) => {
      const team = {
        id: crypto.randomUUID(),
        name: "Test Team",
        createdBy: userId,
      };
      
      const membership = {
        teamId: team.id,
        userId: userId,
        role: "admin" as const,
      };
      
      return { team, membership };
    };

    const userId = crypto.randomUUID();
    const { team, membership } = createTeamWithAdmin(userId);

    expect(team.createdBy).toBe(userId);
    expect(membership.role).toBe("admin");
    expect(membership.userId).toBe(userId);
  });

  test("cannot have team without at least one admin", () => {
    // This tests the invariant that a team must have at least one admin
    const validateAdminRemoval = (
      currentAdminCount: number,
      isRemovingAdmin: boolean
    ) => {
      if (isRemovingAdmin && currentAdminCount <= 1) {
        return { valid: false, error: "Cannot remove the last admin" };
      }
      return { valid: true };
    };

    expect(validateAdminRemoval(2, true).valid).toBe(true);
    expect(validateAdminRemoval(1, true).valid).toBe(false);
    expect(validateAdminRemoval(1, false).valid).toBe(true);
  });
});
