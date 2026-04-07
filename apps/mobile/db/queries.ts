import { eq, sql } from "drizzle-orm";
import { db } from "./client";
import { teams, members, fineTypes, fineEntries } from "./schema";
import * as crypto from "expo-crypto";

function uuid() {
  return crypto.randomUUID();
}

// === Team ===

export function getTeam() {
  const result = db.select().from(teams).limit(1).all();
  return result[0] ?? null;
}

export function createTeam(name: string, currency: string) {
  const id = uuid();
  db.insert(teams).values({
    id,
    name,
    currency,
    createdAt: new Date(),
  }).run();
  return id;
}

export function updateTeam(id: string, data: { name?: string; currency?: string }) {
  db.update(teams).set(data).where(eq(teams.id, id)).run();
}

// === Members ===

export function getMembers(teamId: string) {
  return db.select().from(members).where(eq(members.teamId, teamId)).all();
}

export function createMember(teamId: string, name: string) {
  const id = uuid();
  db.insert(members).values({
    id,
    teamId,
    name,
    createdAt: new Date(),
  }).run();
  return id;
}

export function deleteMember(id: string) {
  db.delete(fineEntries).where(eq(fineEntries.memberId, id)).run();
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
  description?: string
) {
  const id = uuid();
  db.insert(fineTypes).values({
    id,
    teamId,
    name,
    description: description ?? null,
    amount,
    createdAt: new Date(),
  }).run();
  return id;
}

export function updateFineType(
  id: string,
  data: { name?: string; amount?: number; description?: string | null }
) {
  db.update(fineTypes).set(data).where(eq(fineTypes.id, id)).run();
}

export function deleteFineType(id: string) {
  db.delete(fineEntries).where(eq(fineEntries.fineTypeId, id)).run();
  db.delete(fineTypes).where(eq(fineTypes.id, id)).run();
}

// === Fine Entries ===

export function createFineEntry(
  fineTypeId: string,
  memberId: string,
  date: string
) {
  const id = uuid();
  db.insert(fineEntries).values({
    id,
    fineTypeId,
    memberId,
    date,
    createdAt: new Date(),
  }).run();
  return id;
}

export function deleteFineEntry(id: string) {
  db.delete(fineEntries).where(eq(fineEntries.id, id)).run();
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
      COALESCE(SUM(ft.amount), 0) as total
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
    date: string;
  }>(sql`
    SELECT
      fe.id,
      m.name as memberName,
      ft.name as fineTypeName,
      ft.amount,
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
    SELECT COALESCE(SUM(ft.amount), 0) as total
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    JOIN members m ON m.id = fe.member_id
    WHERE m.team_id = ${teamId}
  `);
  return result?.total ?? 0;
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
      COUNT(*) * ft.amount as subtotal
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
  }>(sql`
    SELECT
      fe.id,
      ft.name as fineTypeName,
      fe.date,
      ft.amount
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE fe.member_id = ${memberId}
    ORDER BY fe.date DESC, fe.created_at DESC
  `);

  return { breakdown, history };
}
