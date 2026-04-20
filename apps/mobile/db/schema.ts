import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  doubleDayDate: text("double_day_date"),
  lastMonthlyRunAt: text("last_monthly_run_at"),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const fineTypes = sqliteTable("fine_types", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  name: text("name").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  cadence: text("cadence", { enum: ["one_off", "monthly"] })
    .notNull()
    .default("one_off"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const fineEntries = sqliteTable("fine_entries", {
  id: text("id").primaryKey(),
  fineTypeId: text("fine_type_id")
    .notNull()
    .references(() => fineTypes.id),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  date: text("date").notNull(),
  multiplier: integer("multiplier").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const monthlyFineMembers = sqliteTable(
  "monthly_fine_members",
  {
    fineTypeId: text("fine_type_id")
      .notNull()
      .references(() => fineTypes.id),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
  },
  (table) => [primaryKey({ columns: [table.fineTypeId, table.memberId] })]
);
