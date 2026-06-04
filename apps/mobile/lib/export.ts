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

  const cta = buildCallToAction({ owing: owing.length, outstanding, currency });
  if (cta) {
    lines.push("");
    lines.push(cta);
  }

  return lines.join("\n");
}

interface CallToActionInput {
  owing: number; // how many players still owe this period
  outstanding: number; // total still owed (minor units, e.g. cents)
  currency: string; // currency code — pass to formatAmount(amount, currency)
}

// TODO(you): the closing line of the shared text — the actual nudge to pay.
// This is the line teammates read last, so its tone sets whether the message
// feels like a friendly reminder or a guilt trip. Return "" to omit it entirely.
//
// Things to weigh:
//   - Tone: playful ("settle up before next match 👀") vs. neutral ("Please
//     settle up when you can.") vs. firm. You know this team.
//   - Should it change when everyone's paid (owing === 0)? Maybe a thank-you,
//     maybe nothing.
//   - Mention the total? It's already shown above — repeating can feel naggy.
//   - Keep it to 1, maybe 2 short lines; this rides under a leaderboard in chat.
function buildCallToAction({ owing }: CallToActionInput): string {
  if (owing === 0) return "Thanks for keeping it square 🙏";
  return "Please settle up when you can.";
}
