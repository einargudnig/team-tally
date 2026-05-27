// Billing periods: fines are grouped into windows (weekly / monthly / quarterly)
// so a collector can settle up with each player per window. A Period is derived
// purely from a date + the team's chosen interval — nothing is stored except the
// `payments` that reference a period by `key`.

export type Interval = "weekly" | "monthly" | "quarterly";

export interface Period {
  key: string; // stable id used by payments, e.g. "2026-06" / "2026-Q2" / "2026-W23"
  label: string; // human label, e.g. "June 2026"
  start: string; // inclusive ISO yyyy-mm-dd
  end: string; // inclusive ISO yyyy-mm-dd
  interval: Interval;
}

export const INTERVAL_OPTIONS: { value: Interval; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utc(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

/** Parse a stored "yyyy-mm-dd" string into a UTC Date at midnight. */
function parseIso(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function monthly(d: Date): Period {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  const start = utc(year, month, 1);
  const end = utc(year, month + 1, 0); // day 0 of next month = last day of this one
  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: `${MONTHS_LONG[month]} ${year}`,
    start: isoDate(start),
    end: isoDate(end),
    interval: "monthly",
  };
}

function quarterly(d: Date): Period {
  const year = d.getUTCFullYear();
  const quarter = Math.floor(d.getUTCMonth() / 3); // 0..3
  const firstMonth = quarter * 3;
  const start = utc(year, firstMonth, 1);
  const end = utc(year, firstMonth + 3, 0);
  return {
    key: `${year}-Q${quarter + 1}`,
    label: `Q${quarter + 1} ${year} · ${MONTHS_SHORT[firstMonth]}–${MONTHS_SHORT[firstMonth + 2]}`,
    start: isoDate(start),
    end: isoDate(end),
    interval: "quarterly",
  };
}

function weekly(d: Date): Period {
  // ISO week: weeks start Monday; week 1 is the week containing the year's first
  // Thursday. We shift to the Thursday of the current week to get the ISO year,
  // then count weeks from that year's first Thursday.
  const day = utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const isoDow = (day.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(day);
  monday.setUTCDate(day.getUTCDate() - isoDow);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();
  const firstThursday = utc(isoYear, 0, 1 + ((4 - new Date(Date.UTC(isoYear, 0, 1)).getUTCDay() + 7) % 7));
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000));

  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth();
  const label = sameMonth
    ? `${MONTHS_SHORT[monday.getUTCMonth()]} ${monday.getUTCDate()}–${sunday.getUTCDate()}`
    : `${MONTHS_SHORT[monday.getUTCMonth()]} ${monday.getUTCDate()} – ${MONTHS_SHORT[sunday.getUTCMonth()]} ${sunday.getUTCDate()}`;

  return {
    key: `${isoYear}-W${String(week).padStart(2, "0")}`,
    label,
    start: isoDate(monday),
    end: isoDate(sunday),
    interval: "weekly",
  };
}

export function periodForDate(date: Date, interval: Interval): Period {
  if (interval === "weekly") return weekly(date);
  if (interval === "quarterly") return quarterly(date);
  return monthly(date);
}

export function currentPeriod(interval: Interval): Period {
  return periodForDate(new Date(), interval);
}

export function previousPeriod(period: Period): Period {
  const dayBefore = parseIso(period.start);
  dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
  return periodForDate(dayBefore, period.interval);
}

export function nextPeriod(period: Period): Period {
  const dayAfter = parseIso(period.end);
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
  return periodForDate(dayAfter, period.interval);
}

/** True when `period` is the one we're living in right now. Used to disable "next". */
export function isCurrentPeriod(period: Period): boolean {
  return period.key === currentPeriod(period.interval).key;
}

export type PaymentStatus = "unpaid" | "partial" | "paid";

// Snapshot payment status: compares what a player owes for a period
// (`periodTotal`) against the snapshot recorded when they were marked paid
// (`amountPaid`). A later-added fine raises the total above the snapshot and
// reopens a "partial" balance; a deleted fine can leave the snapshot above the
// total, so `remaining` is floored at zero. "paid" uses >= so over-coverage
// still counts as settled, and an untouched player (amountPaid === 0) is always
// "unpaid" rather than "partial".
export function derivePaymentStatus(
  periodTotal: number,
  amountPaid: number
): { status: PaymentStatus; remaining: number } {
  const remaining = Math.max(0, periodTotal - amountPaid);
  if (amountPaid <= 0) return { status: "unpaid", remaining };
  if (amountPaid >= periodTotal) return { status: "paid", remaining: 0 };
  return { status: "partial", remaining };
}
