# App Store Screenshot Plan

Apple requires 3–10 screenshots for the **6.5" iPhone** display size. One set covers all modern iPhones. Submission is blocked without them.

## Target spec

- **Device class**: 6.5" iPhone
- **Resolution**: 1284×2778 (iPhone 14 Plus / 15 Plus) **or** 1242×2688 (iPhone 11 Pro Max)
- **Format**: PNG
- **Count**: 5 — enough to tell the story without thinning attention

## Recommended Simulator

```bash
xcrun simctl list devices available | grep "iPhone 16 Pro Max"
open -a Simulator
```

iPhone 16 Pro Max gives 1320×2868 (close enough — ASC auto-resizes downward).

## Pin the status bar to a clean state

```
xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3 --dataNetwork wifi --cellularMode active
```

`9:41` is the Apple convention. Looks intentional.

---

## The 5 shots (in store-page order)

The first 2 screenshots are what most users see in search results — front-load the hook.

### 1. Home / Leaderboard — "the hero shot"

**Why:** The fastest way to communicate "this app shows who's worst on your team". The current period is labelled at the top ("Outstanding · June 2026"), so the period feature gets *implicit* exposure without needing its own shot.

**Screen:** `(tabs)/index.tsx`

**Seed needs:** Mixed payment status visible (a `Paid` badge, a `Paid €X of €Y` partial subline, and unpaid amounts) — the seed already produces this.

### 2. Player Detail — "the receipts"

**Why:** Shows the depth — every fine timestamped, totalled, no escape.

**Screen:** `player/[id].tsx` — open Messi (top of leaderboard).

**Seed needs:** 12 fines across multiple types and dates — the seed already handles this.

### 3. Mark Paid action sheet — "the new beat"

**Why:** This is the headline new feature since v1.0 was first drafted. The action sheet shows the `Mark paid · €X` line with a real amount — communicates the payment-tracking flow in one frame.

**Screen:** `(tabs)/index.tsx` with the action sheet open. Tap any unpaid player on the leaderboard to trigger it.

**Seed needs:** An unpaid player at the top — Messi (idx 0) works perfectly.

### 4. Add Fine sheet — "the daily ritual"

**Why:** The core interaction; the thing you do every training. Quick, tactile.

**Screen:** `add-fine.tsx` opened as a sheet from the `+` FAB.

**Seed needs:** A handful of fine types + members so the pickers look populated — seed covers this.

### 5. Double Day toggle on Home — "the moment"

**Why:** Distinctive feature unique to this app. Toggle ON visible, banner highlighted, total outstanding doubled. Conveys "fun" + "we get sports culture".

**Screen:** `(tabs)/index.tsx` with double-day banner active. Tap the `2×` banner before capturing.

**Seed needs:** Same as shot 1, with the toggle flipped on.

---

## Seed data — dev-only button in Settings

`lib/seed-demo.ts` exposes `seedDemoData()`, surfaced as a "Seed demo data (dev only)" button at the bottom of Settings in `__DEV__` builds.

Loads:
- Team: **Legends FC**, currency **EUR**, interval **monthly**
- Players: Messi, Ronaldo, Mbappé, Haaland, Neymar Jr, Modrić
- Fines spread across the current month + 2 previous months (so stepping back in the period selector shows real data)
- One player paid in full, one partial — so the leaderboard shot shows all three status badges

To re-seed for a retake: Settings → "Seed demo data (dev only)" → confirm.

---

## Capture workflow

1. Boot the simulator (iPhone 16 Pro Max), apply the status-bar override.
2. Build & install the dev app: `bun x expo run:ios --device <UDID>` (5–15 min cold cache).
3. Complete onboarding once with any team name (then dev seed will overwrite it).
4. Settings → "Seed demo data (dev only)" → confirm.
5. Navigate to each of the 5 screens above.
6. Capture each with: `xcrun simctl io booted screenshot apps/mobile/screenshots/0N-name.png`

---

## Decision points

Locked in for the current set:

- **Team name** — Legends FC
- **Currency** — EUR
- **Player names** — football superstars (matches v1 screenshots)

If you want to localize for the Icelandic market later (Hraunsmenn FC + ISK + Icelandic names per the suggestions below), edit `lib/seed-demo.ts` and re-shoot — the dev button makes this ~2 minutes.

> **Icelandic-market alternates** (kept for future use):
> - Team: `Hraunsmenn FC`, `Sunday League B`, `KR drengjaflokkur`
> - Players: Jón Gunnarsson, Aron Einarsson, Birkir Þór, Daníel Snær, Egill Pálsson, Fannar Logi
> - Currency: ISK
