// Upcoming features for the Team Tally landing page roadmap section.
//
// TODO (user contribution): Fill in the 4–6 items below with features you
// actually plan to ship next. This is the one place where your roadmap lives
// on the marketing site, so be specific — vague items like "more features"
// are worse than having fewer items.
//
// Status values:
//   - "next"     → actively being built, shows a pulsing amber badge
//   - "planned"  → committed to, no date yet
//   - "exploring" → still thinking about it, lowest commitment
//
// Keep titles ≤ 40 chars and descriptions ≤ 140 chars so the cards stay tidy.

export type RoadmapStatus = "next" | "planned" | "exploring";

interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  icon: string; // single emoji
}

export const roadmap: RoadmapItem[] = [
  // --- PLACEHOLDERS — replace these with your real roadmap ---
  {
    title: "Multi-team sync",
    description:
      "Sign in once and switch between your club, your five-a-side team, and your futsal squad.",
    status: "next",
    icon: "🔄",
  },
  {
    title: "Group kitty payments",
    description:
      "Pay what you owe straight from the app via Stripe — no more chasing people for cash.",
    status: "next",
    icon: "💳",
  },
  {
    title: "Season stats & awards",
    description:
      "End-of-season report: biggest offender, cleanest player, most improved, total raised.",
    status: "planned",
    icon: "📊",
  },
  {
    title: "Match day mode",
    description:
      "Quick-add buttons for the most common offences so the captain can log fines in one tap.",
    status: "planned",
    icon: "⚽",
  },
  {
    title: "Share & brag",
    description: "Export leaderboard cards for the team WhatsApp group. Public shame, optimized.",
    status: "exploring",
    icon: "📣",
  },
  {
    title: "Android app",
    description:
      "iOS first, Android close behind. Same codebase, same features, same amber accents.",
    status: "exploring",
    icon: "🤖",
  },
];
