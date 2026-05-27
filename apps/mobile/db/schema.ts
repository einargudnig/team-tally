import { sqliteTable, text, integer, primaryKey, unique } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  doubleDayDate: text("double_day_date"),
  lastMonthlyRunAt: text("last_monthly_run_at"),
  onboardingCompletedAt: integer("onboarding_completed_at", { mode: "timestamp_ms" }),
  fineInterval: text("fine_interval", { enum: ["weekly", "monthly", "quarterly"] })
    .notNull()
    .default("monthly"),
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

// One row per (member, period) once that player has settled up for the period.
// `amountPaid` is a snapshot of what was owed at the moment it was marked paid —
// fines logged into the same period afterwards reopen a remaining balance.
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => members.id),
    periodKey: text("period_key").notNull(),
    interval: text("interval", { enum: ["weekly", "monthly", "quarterly"] }).notNull(),
    amountPaid: integer("amount_paid").notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [unique().on(table.memberId, table.periodKey)]
);
