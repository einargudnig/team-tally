import { and, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { teams, members, fineTypes, fineEntries, monthlyFineMembers, payments } from "./schema";
import { derivePaymentStatus, type Interval, type Period, type PaymentStatus } from "@/lib/period";
import * as crypto from "expo-crypto";

type Cadence = "one_off" | "monthly";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

function firstOfMonthIso(monthIso: string) {
  return `${monthIso}-01`;
}

function uuid() {
  return crypto.randomUUID();
}

// === Team ===

export function getTeam() {
  const result = db.select().from(teams).limit(1).all();
  return result[0] ?? null;
}

export function createTeam(name: string, currency: string, fineInterval: Interval = "monthly") {
  const id = uuid();
  db.insert(teams)
    .values({
      id,
      name,
      currency,
      fineInterval,
      createdAt: new Date(),
    })
    .run();
  return id;
}

export function updateTeam(
  id: string,
  data: { name?: string; currency?: string; fineInterval?: Interval }
) {
  db.update(teams).set(data).where(eq(teams.id, id)).run();
}

export type DayReminder = { day: number; time: string }; // day 1=Sun … 7=Sat, time "HH:MM"
export type ReminderSettings = {
  enabled: boolean;
  schedule: DayReminder[]; // one entry per selected day, each with its own time
};

export function getReminderSettings(team: {
  reminderEnabled: boolean;
  reminderSchedule: string | null;
}): ReminderSettings {
  let schedule: DayReminder[] = [];
  if (team.reminderSchedule) {
    try {
      const parsed = JSON.parse(team.reminderSchedule);
      if (Array.isArray(parsed)) {
        schedule = parsed
          .filter((e) => typeof e?.day === "number" && typeof e?.time === "string")
          .map((e) => ({ day: e.day as number, time: e.time as string }))
          .sort((a, b) => a.day - b.day);
      }
    } catch {
      // corrupt value — fall back to no schedule
    }
  }
  return { enabled: team.reminderEnabled, schedule };
}

export function setReminderSettings(teamId: string, settings: ReminderSettings) {
  db.update(teams)
    .set({
      reminderEnabled: settings.enabled,
      reminderSchedule: settings.schedule.length ? JSON.stringify(settings.schedule) : null,
    })
    .where(eq(teams.id, teamId))
    .run();
}

// === Onboarding ===

export type OnboardingStep = "team" | "players" | "fines" | "first-fine";

export function isOnboardingComplete(): boolean {
  const team = getTeam();
  return !!team?.onboardingCompletedAt;
}

export function markOnboardingComplete(teamId: string) {
  db.update(teams).set({ onboardingCompletedAt: new Date() }).where(eq(teams.id, teamId)).run();
}

export function getOnboardingResumeStep(): OnboardingStep {
  const team = getTeam();
  if (!team) return "team";
  if (getMembers(team.id).length === 0) return "players";
  if (getFineTypes(team.id).length === 0) return "fines";
  return "first-fine";
}

// === Members ===

export function getMembers(teamId: string) {
  return db.select().from(members).where(eq(members.teamId, teamId)).all();
}

export function createMember(teamId: string, name: string) {
  const id = uuid();
  db.insert(members)
    .values({
      id,
      teamId,
      name,
      createdAt: new Date(),
    })
    .run();
  return id;
}

export function deleteMember(id: string) {
  db.delete(fineEntries).where(eq(fineEntries.memberId, id)).run();
  db.delete(payments).where(eq(payments.memberId, id)).run();
  db.delete(monthlyFineMembers).where(eq(monthlyFineMembers.memberId, id)).run();
  db.delete(members).where(eq(members.id, id)).run();
}

// === Fine Types ===

export function getFineTypes(teamId: string) {
  return db.select().from(fineTypes).where(eq(fineTypes.teamId, teamId)).all();
}

export function createFineType(
  teamId: string,
  name: string,
  amount: number,
  options?: {
    description?: string;
    cadence?: Cadence;
    memberIds?: string[];
  }
) {
  const id = uuid();
  const cadence = options?.cadence ?? "one_off";
  db.insert(fineTypes)
    .values({
      id,
      teamId,
      name,
      description: options?.description ?? null,
      amount,
      cadence,
      createdAt: new Date(),
    })
    .run();
  if (cadence === "monthly" && options?.memberIds?.length) {
    setMonthlyFineMembers(id, options.memberIds);
  }
  return id;
}

export function deleteFineType(id: string) {
  db.delete(fineEntries).where(eq(fineEntries.fineTypeId, id)).run();
  db.delete(monthlyFineMembers).where(eq(monthlyFineMembers.fineTypeId, id)).run();
  db.delete(fineTypes).where(eq(fineTypes.id, id)).run();
}

export function getMonthlyFineMemberIds(fineTypeId: string): string[] {
  return db
    .select({ memberId: monthlyFineMembers.memberId })
    .from(monthlyFineMembers)
    .where(eq(monthlyFineMembers.fineTypeId, fineTypeId))
    .all()
    .map((r) => r.memberId);
}

export function setMonthlyFineMembers(fineTypeId: string, memberIds: string[]) {
  db.delete(monthlyFineMembers).where(eq(monthlyFineMembers.fineTypeId, fineTypeId)).run();
  if (memberIds.length === 0) return;
  db.insert(monthlyFineMembers)
    .values(memberIds.map((memberId) => ({ fineTypeId, memberId })))
    .run();
}

// === Fine Entries ===

export function createFineEntry(
  fineTypeId: string,
  memberId: string,
  date: string,
  multiplier = 1
) {
  const id = uuid();
  db.insert(fineEntries)
    .values({
      id,
      fineTypeId,
      memberId,
      date,
      multiplier,
      createdAt: new Date(),
    })
    .run();
  return id;
}

export function deleteFineEntry(id: string) {
  db.delete(fineEntries).where(eq(fineEntries.id, id)).run();
}

export function getFineEntry(id: string) {
  return db.select().from(fineEntries).where(eq(fineEntries.id, id)).get() ?? null;
}

export function updateFineEntry(
  id: string,
  data: { fineTypeId?: string; memberId?: string; date?: string; multiplier?: number }
) {
  db.update(fineEntries).set(data).where(eq(fineEntries.id, id)).run();
}

export function updateFineType(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    amount?: number;
    cadence?: Cadence;
    memberIds?: string[];
  }
) {
  const { memberIds, ...rest } = data;
  if (Object.keys(rest).length > 0) {
    db.update(fineTypes).set(rest).where(eq(fineTypes.id, id)).run();
  }
  if (memberIds !== undefined) {
    setMonthlyFineMembers(id, memberIds);
  }
}

// === Double day ===

export function isDoubleDayActive(team: { doubleDayDate: string | null }) {
  return team.doubleDayDate === todayIso();
}

export function setDoubleDay(teamId: string, active: boolean) {
  db.update(teams)
    .set({ doubleDayDate: active ? todayIso() : null })
    .where(eq(teams.id, teamId))
    .run();
}

// === Monthly cadence ===

export function getMonthlyFineTypes(teamId: string) {
  return db
    .select()
    .from(fineTypes)
    .where(and(eq(fineTypes.teamId, teamId), eq(fineTypes.cadence, "monthly")))
    .all();
}

/**
 * Lazy catch-up: for each month between team.lastMonthlyRunAt and the current
 * month, insert a fine entry for every (monthly fine type, opted-in member)
 * pair — unless an entry already exists for that (type, member, month-start).
 * Safe to call on every app focus; idempotent.
 */
export function applyMonthlyFines(teamId: string) {
  const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
  if (!team) return 0;

  const now = new Date();
  const currentMonth = monthKey(now);
  const startMonth = team.lastMonthlyRunAt ?? currentMonth;

  const months: string[] = [];
  const cursor = new Date(`${startMonth}-01T00:00:00Z`);
  const end = new Date(`${currentMonth}-01T00:00:00Z`);
  while (cursor <= end) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const monthlyTypes = getMonthlyFineTypes(teamId);
  if (monthlyTypes.length === 0) {
    db.update(teams).set({ lastMonthlyRunAt: currentMonth }).where(eq(teams.id, teamId)).run();
    return 0;
  }

  let inserted = 0;
  for (const month of months) {
    const date = firstOfMonthIso(month);
    for (const ft of monthlyTypes) {
      const memberIds = getMonthlyFineMemberIds(ft.id);
      for (const memberId of memberIds) {
        const existing = db
          .select({ id: fineEntries.id })
          .from(fineEntries)
          .where(
            and(
              eq(fineEntries.fineTypeId, ft.id),
              eq(fineEntries.memberId, memberId),
              eq(fineEntries.date, date)
            )
          )
          .get();
        if (existing) continue;
        createFineEntry(ft.id, memberId, date, 1);
        inserted++;
      }
    }
  }

  db.update(teams).set({ lastMonthlyRunAt: currentMonth }).where(eq(teams.id, teamId)).run();
  return inserted;
}

// === Dashboard Queries ===

export function getLeaderboard(teamId: string) {
  return db.all<{
    memberId: string;
    memberName: string;
    total: number;
  }>(sql`
    SELECT
      m.id as memberId,
      m.name as memberName,
      COALESCE(SUM(ft.amount * fe.multiplier), 0) as total
    FROM members m
    LEFT JOIN fine_entries fe ON fe.member_id = m.id
    LEFT JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE m.team_id = ${teamId}
    GROUP BY m.id, m.name
    ORDER BY total DESC
  `);
}

export function getRecentActivity(teamId: string, limit = 20) {
  return db.all<{
    id: string;
    memberName: string;
    fineTypeName: string;
    amount: number;
    multiplier: number;
    date: string;
  }>(sql`
    SELECT
      fe.id,
      m.name as memberName,
      ft.name as fineTypeName,
      ft.amount * fe.multiplier as amount,
      fe.multiplier,
      fe.date
    FROM fine_entries fe
    JOIN members m ON m.id = fe.member_id
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE m.team_id = ${teamId}
    ORDER BY fe.date DESC, fe.created_at DESC
    LIMIT ${limit}
  `);
}

export function getTotalOutstanding(teamId: string) {
  const result = db.get<{ total: number }>(sql`
    SELECT COALESCE(SUM(ft.amount * fe.multiplier), 0) as total
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    JOIN members m ON m.id = fe.member_id
    WHERE m.team_id = ${teamId}
  `);
  return result?.total ?? 0;
}

// === Period payments ===

export type PeriodLeaderboardEntry = {
  memberId: string;
  memberName: string;
  total: number; // owed for this period
  amountPaid: number; // snapshot recorded when marked paid (0 if never)
  remaining: number; // still owed for this period
  status: PaymentStatus;
};

/**
 * Per-player standing for a single period: how much each owes within the
 * period's date window, how much they've been marked as paying, and the derived
 * status. Sorted with the biggest outstanding balances first so the collector
 * sees who still owes; fully-paid players sink to the bottom.
 */
export function getPeriodLeaderboard(teamId: string, period: Period): PeriodLeaderboardEntry[] {
  const totals = db.all<{ memberId: string; memberName: string; total: number }>(sql`
    SELECT
      m.id as memberId,
      m.name as memberName,
      COALESCE(SUM(ft.amount * fe.multiplier), 0) as total
    FROM members m
    LEFT JOIN fine_entries fe
      ON fe.member_id = m.id AND fe.date >= ${period.start} AND fe.date <= ${period.end}
    LEFT JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE m.team_id = ${teamId}
    GROUP BY m.id, m.name
  `);

  const paidRows = db
    .select({ memberId: payments.memberId, amountPaid: payments.amountPaid })
    .from(payments)
    .where(eq(payments.periodKey, period.key))
    .all();
  const paidByMember = new Map(paidRows.map((r) => [r.memberId, r.amountPaid]));

  return totals
    .map((row) => {
      const amountPaid = paidByMember.get(row.memberId) ?? 0;
      const { status, remaining } = derivePaymentStatus(row.total, amountPaid);
      return { ...row, amountPaid, remaining, status };
    })
    .sort((a, b) => b.remaining - a.remaining || b.total - a.total);
}

/** Total still owed across all players for the period (sum of remaining). */
export function getPeriodOutstanding(teamId: string, period: Period): number {
  return getPeriodLeaderboard(teamId, period).reduce((sum, e) => sum + e.remaining, 0);
}

/** Mark a player as paid for the period, snapshotting the current amount owed. */
export function markPeriodPaid(memberId: string, period: Period, amount: number) {
  db.insert(payments)
    .values({
      id: uuid(),
      memberId,
      periodKey: period.key,
      interval: period.interval,
      amountPaid: amount,
      paidAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [payments.memberId, payments.periodKey],
      set: { amountPaid: amount, interval: period.interval, paidAt: new Date() },
    })
    .run();
}

/** Undo a payment mark for a player in a period. */
export function markPeriodUnpaid(memberId: string, periodKey: string) {
  db.delete(payments)
    .where(and(eq(payments.memberId, memberId), eq(payments.periodKey, periodKey)))
    .run();
}

export function getPlayerDetail(memberId: string) {
  const breakdown = db.all<{
    fineTypeId: string;
    fineTypeName: string;
    amount: number;
    count: number;
    subtotal: number;
  }>(sql`
    SELECT
      ft.id as fineTypeId,
      ft.name as fineTypeName,
      ft.amount,
      COUNT(*) as count,
      SUM(ft.amount * fe.multiplier) as subtotal
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE fe.member_id = ${memberId}
    GROUP BY ft.id, ft.name, ft.amount
    ORDER BY subtotal DESC
  `);

  const history = db.all<{
    id: string;
    fineTypeName: string;
    date: string;
    amount: number;
    multiplier: number;
  }>(sql`
    SELECT
      fe.id,
      ft.name as fineTypeName,
      fe.date,
      ft.amount * fe.multiplier as amount,
      fe.multiplier
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE fe.member_id = ${memberId}
    ORDER BY fe.date DESC, fe.created_at DESC
  `);

  return { breakdown, history };
}
