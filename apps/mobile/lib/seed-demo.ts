import { db } from "@/db/client";
import { teams, members, fineTypes, fineEntries, monthlyFineMembers } from "@/db/schema";
import { createTeam, createMember, createFineType, createFineEntry } from "@/db/queries";

const PLAYER_NAMES = [
  "Lionel Messi",
  "Cristiano Ronaldo",
  "Kylian Mbappé",
  "Erling Haaland",
  "Neymar Jr",
  "Luka Modrić",
];

const FINES_PER_PLAYER = [10, 7, 6, 5, 4, 3];

const ONE_OFF_FINES: { name: string; amount: number }[] = [
  { name: "Late to training", amount: 500 },
  { name: "Phone out during huddle", amount: 1000 },
  { name: "Missed training", amount: 2000 },
  { name: "Wrong colour socks", amount: 500 },
  { name: "Too much celebration", amount: 1500 },
  { name: "Late to match", amount: 2500 },
];

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function seedDemoData() {
  db.delete(fineEntries).run();
  db.delete(monthlyFineMembers).run();
  db.delete(fineTypes).run();
  db.delete(members).run();
  db.delete(teams).run();

  const teamId = createTeam("Legends FC", "EUR");
  const memberIds = PLAYER_NAMES.map((name) => createMember(teamId, name));
  const fineTypeIds = ONE_OFF_FINES.map((ft) => createFineType(teamId, ft.name, ft.amount));
  createFineType(teamId, "Monthly subs", 3000, { cadence: "monthly", memberIds });

  let entryCount = 0;
  memberIds.forEach((memberId, playerIdx) => {
    const count = FINES_PER_PLAYER[playerIdx];
    for (let i = 0; i < count; i++) {
      const fineTypeIdx = (playerIdx + i) % fineTypeIds.length;
      const daysAgo = (i * 5 + playerIdx) % 28;
      createFineEntry(fineTypeIds[fineTypeIdx], memberId, daysAgoIso(daysAgo));
      entryCount++;
    }
  });

  return { teamId, memberCount: memberIds.length, entryCount };
}
