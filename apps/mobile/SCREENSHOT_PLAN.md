# App Store Screenshot Plan

Apple requires 3–10 screenshots for the **6.5" iPhone** display size. One set covers all modern iPhones. Submission is blocked without them.

## Target spec

- **Device class**: 6.5" iPhone
- **Resolution**: 1284×2778 (iPhone 14 Plus / 15 Plus) **or** 1242×2688 (iPhone 11 Pro Max)
- **Format**: PNG (Cmd+S in Simulator gives this by default)
- **Count**: 5 recommended — enough to tell the story without thinning attention

## Recommended Simulator

```bash
xcrun simctl list devices available | grep "iPhone 16 Pro Max"
# Boot it:
open -a Simulator
# Then Hardware → Device → iPhone 16 Pro Max
```

iPhone 16 Pro Max gives 1320×2868 (close enough — ASC auto-resizes downward).
If you'd rather match the spec exactly, use **iPhone 15 Plus** instead.

---

## The 5 shots (in store-page order)

The first 2 screenshots are what most users see in search results. Front-load the hook.

### 1. Home / Leaderboard — "the hero shot"

**Why:** The fastest way to communicate "this app shows who's worst on your team". Visual social proof: a leaderboard. Standings + total kitty visible.

**Screen:** `(tabs)/index.tsx`

**Seed needs:** 5–8 members, fines applied so leaderboard has meaningful gaps, total outstanding visible at top.

### 2. Player Detail — "the receipts"

**Why:** Shows the depth — every fine timestamped, totalled, no escape. The "your data is safe and visible" angle.

**Screen:** `player/[id].tsx`

**Seed needs:** One player with 8–15 fines across different fine types, mixed dates.

### 3. Add Fine sheet — "the daily ritual"

**Why:** Demos the core interaction (the thing you do every training). Quick, tactile. Last commit polished this — show it off.

**Screen:** `add-fine.tsx` open as a sheet.

**Seed needs:** A handful of fine types + members so the pickers look populated.

### 4. Fines tab — "the catalog"

**Why:** Communicates "fully customizable" — your fines, your amounts, your team's rules. Shows monthly cadence labels for the recurring ones.

**Screen:** `(tabs)/fines.tsx`

**Seed needs:** 6–10 fine types, mix of one-off and monthly cadence, amounts in your team currency.

### 5. Double Day toggle on Home — "the moment"

**Why:** A distinctive feature unique to this app. Toggle ON visible, total outstanding doubled. Conveys "fun" + "we get sports culture".

**Screen:** `(tabs)/index.tsx` with double-day banner active.

**Seed needs:** Same as shot 1, but flip the double-day toggle before capturing.

> **Alternative #5:** Settings screen. Skip if you'd rather lead with feature delight over customization.

---

## Seed data — pick a vibe

The data on screen is brand. "Player 1, Player 2" instantly reads as a screenshot mockup; real-feeling names sell that this is a tool real teams use.

**Suggested team name:** something specific but generic enough to feel real. E.g. `Hraunsmenn FC`, `Sunday League B`, `KR drengjaflokkur`.

**Suggested player names (8 — pick any 6):**
- Jón Gunnarsson
- Aron Einarsson
- Birkir Þór
- Daníel Snær
- Egill Pálsson
- Fannar Logi
- Gunnar Þorvaldsson
- Hjalti Már

> Real-feeling Icelandic names anchor authenticity for the Icelandic market. Swap for English names if launching globally first.

**Suggested fine types:**
- `Late to training` — 500 ISK — one_off
- `Phone out during huddle` — 1000 ISK — one_off
- `Missed training` — 2000 ISK — one_off
- `Wrong colour socks` — 500 ISK — one_off
- `Goal celebration too much` — 1500 ISK — one_off
- `Monthly subs` — 3000 ISK — monthly
- `Late to match` — 2500 ISK — one_off

---

## Capture workflow

1. Boot the simulator (iPhone 16 Pro Max or 15 Plus)
2. Run the app: `bun run dev:mobile` from repo root (or `cd apps/mobile && bun start --ios`)
3. Complete onboarding with your chosen team name
4. **Seed by hand via the UI** — players + fine types + a batch of fine entries. ~5 min of tapping.
5. Take screenshots: **Cmd+S** in Simulator saves PNG to Desktop. The filename includes the device + timestamp.
6. Rename them numerically: `01-leaderboard.png`, `02-player-detail.png`, etc. — ASC takes them in upload order.

> **Tip:** Set status bar to a perfect state — full battery, no notch indicators — with:
> ```
> xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
> ```
> `9:41` is the Apple convention. Looks intentional.

---

## Optional: seed script

If you'd rather not hand-seed each time, I can write a one-shot `scripts/seed.ts` that calls the same `db/queries.ts` helpers to create the suggested team + players + fines in one go. Costs ~20 lines of code, saves you ~5 min per re-shoot. Useful if you end up needing to retake screenshots later (e.g. after a UI tweak).

---

## Decision points (your call)

These shape the screenshots more than any technical setting:

- **Team name** — what feels right for your store page
- **Currency** — ISK (Icelandic focus) or USD/EUR (global focus)
- **Player names** — Icelandic, English, or fictional/funny
- **Fine type vibe** — earnest ("Late to training") vs. cheeky ("Goal celebration too much"). The mix sets the app's tone.

A coherent voice across these 5 shots is worth more than any single shot being perfect.
