import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Users table - stores user accounts
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // For email/password auth
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Teams table - groups that users can create
 */
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Team members - join table for users and teams with role
 */
export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(), // UUID
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Fines - penalties that can be assigned within a team
 */
export const fines = sqliteTable("fines", {
  id: text("id").primaryKey(), // UUID
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  amount: real("amount"), // Optional amount
  fineDate: integer("fine_date", { mode: "timestamp" }).notNull(), // Date the fine applies to
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Allocations - assigns fines to team members
 */
export const allocations = sqliteTable("allocations", {
  id: text("id").primaryKey(), // UUID
  fineId: text("fine_id").notNull().references(() => fines.id, { onDelete: "cascade" }),
  memberId: text("member_id").notNull().references(() => teamMembers.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1), // 1-3
  allocatedAt: integer("allocated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  allocatedBy: text("allocated_by").notNull().references(() => users.id),
});

/**
 * Sessions table - for better-auth session management
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ============ Relations ============

export const usersRelations = relations(users, ({ many }) => ({
  teams: many(teams),
  teamMemberships: many(teamMembers),
  sessions: many(sessions),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  members: many(teamMembers),
  fines: many(fines),
}));

export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  allocations: many(allocations),
}));

export const finesRelations = relations(fines, ({ one, many }) => ({
  team: one(teams, {
    fields: [fines.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [fines.createdBy],
    references: [users.id],
  }),
  allocations: many(allocations),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  fine: one(fines, {
    fields: [allocations.fineId],
    references: [fines.id],
  }),
  member: one(teamMembers, {
    fields: [allocations.memberId],
    references: [teamMembers.id],
  }),
  allocator: one(users, {
    fields: [allocations.allocatedBy],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
