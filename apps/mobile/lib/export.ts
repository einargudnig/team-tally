import { formatAmount } from "@/lib/currency";
import type { PeriodLeaderboardEntry } from "@/db/queries";
import type { Period } from "@/lib/period";

export interface LeaderboardExport {
  teamName: string;
  currency: string;
  period: Period;
  leaderboard: PeriodLeaderboardEntry[];
  outstanding: number; // total still owed across all players this period
}

// Turn a period's standings into a plain-text snapshot the collector can drop
// into WhatsApp / Messages so each player sees what they owe. Plain text (not an
// image) so it stays copy-pasteable and needs no native capture lib.
//
// Default format choices (tweak to taste):
//   - Lists only players who still owe — it's a nudge to pay, not a full roster.
//   - Fully-paid players are summarised in a single footer line, not enumerated.
//   - Amounts are space-padded to align; chat apps rarely use monospace, so this
//     is best-effort, not pixel-perfect.
export function buildLeaderboardExport(data: LeaderboardExport): string {
  const { teamName, currency, period, leaderboard, outstanding } = data;

  const owing = leaderboard.filter((e) => e.remaining > 0);
  const settled = leaderboard.filter((e) => e.total > 0 && e.remaining === 0).length;

  const lines: string[] = [`${teamName} — ${period.label}`, ""];

  if (owing.length === 0) {
    lines.push("Everyone's square 🎉");
  } else {
    const nameWidth = Math.max(...owing.map((e) => e.memberName.length));
    const amounts = owing.map((e) => formatAmount(e.remaining, currency));
    const amountWidth = Math.max(...amounts.map((a) => a.length));
    owing.forEach((e, i) => {
      const partial = e.status === "partial" ? "  (partial)" : "";
      lines.push(`${e.memberName.padEnd(nameWidth)}  ${amounts[i].padStart(amountWidth)}${partial}`);
    });
    lines.push("");
    lines.push(`Total outstanding: ${formatAmount(outstanding, currency)}`);
  }

  if (settled > 0) {
    lines.push(`${settled} ${settled === 1 ? "player" : "players"} paid up ✓`);
  }

  return lines.join("\n");
}
