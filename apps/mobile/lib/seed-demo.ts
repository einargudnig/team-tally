import { db } from "@/db/client";
import { teams, members, fineTypes, fineEntries, monthlyFineMembers, payments } from "@/db/schema";
import {
  createTeam,
  createMember,
  createFineType,
  createFineEntry,
  markPeriodPaid,
} from "@/db/queries";
import { currentPeriod } from "@/lib/period";

const PLAYER_NAMES = [
  "Gavi",
  "Lamine Yamal",
  "Raphinha",
  "Pedri",
  "Frenkie de Jong",
  "Robert Lewandowski",
];

const ONE_OFF_FINES: { name: string; amount: number }[] = [
  { name: "Late to training", amount: 500 },
  { name: "Phone out during huddle", amount: 1000 },
  { name: "Missed training", amount: 2000 },
  { name: "Wrong colour socks", amount: 500 },
  { name: "Too much celebration", amount: 1500 },
  { name: "Late to match", amount: 2500 },
];

// Fines per player, indexed by [playerIdx][monthsAgo].
// Heavier in the current month so the live shot has stories; sparser further back
// so the period stepper shows real-but-different data without faking a full
// duplicate month.
const FINES_BY_PLAYER_BY_MONTH: number[][] = [
  [6, 4, 2], // Messi — worst offender
  [5, 3, 2],
  [4, 3, 1],
  [3, 2, 1],
  [2, 2, 1],
  [1, 1, 0], // Modrić — saint
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateInMonth(monthsAgo: number, dayOffset: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1 + dayOffset));
  return isoDate(d);
}

export function seedDemoData() {
  db.delete(payments).run();
  db.delete(fineEntries).run();
  db.delete(monthlyFineMembers).run();
  db.delete(fineTypes).run();
  db.delete(members).run();
  db.delete(teams).run();

  const teamId = createTeam("FC Barcelona", "EUR", "monthly");
  const memberIds = PLAYER_NAMES.map((name) => createMember(teamId, name));
  const fineTypeIds = ONE_OFF_FINES.map((ft) => createFineType(teamId, ft.name, ft.amount));
  createFineType(teamId, "Monthly subs", 3000, { cadence: "monthly", memberIds });

  let entryCount = 0;
  memberIds.forEach((memberId, playerIdx) => {
    FINES_BY_PLAYER_BY_MONTH[playerIdx].forEach((count, monthsAgo) => {
      for (let i = 0; i < count; i++) {
        const fineTypeIdx = (playerIdx + i + monthsAgo) % fineTypeIds.length;
        const dayOffset = (i * 4 + playerIdx * 2) % 25;
        createFineEntry(fineTypeIds[fineTypeIdx], memberId, dateInMonth(monthsAgo, dayOffset));
        entryCount++;
      }
    });
  });

  // Current-period status variety so the leaderboard shot displays all three
  // badges. We pick low-volume players (last two) so the badges land near the
  // bottom of the list rather than competing with the "worst offender" framing.
  const current = currentPeriod("monthly");
  markPeriodPaid(memberIds[5], current, 999_999); // Modrić — paid in full
  markPeriodPaid(memberIds[4], current, 2000); // Neymar — partial

  return { teamId, memberCount: memberIds.length, entryCount };
}
