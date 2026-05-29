# Team Tally — App Store Metadata

> **All copy below is a first-pass draft for audit.** Read, change anything that doesn't sound like you, then paste into App Store Connect.
> Character counts are at the end of each section.

---

## Subtitle (≤30 chars)

Shown directly below the app name on the store page. Weighted heavily by App Store search. Cannot be changed without a new version submission.

```
The team fine tracker.
```

Count: **22 / 30**

> Alternates (kept for future updates):
>
> - `Fines, kitty, team table.` (25)
> - `Track team fines offline.` (25)
> - `Settle the kitty, every week.` (29)

---

## Keywords (≤100 chars total, comma-separated, NO spaces after commas)

Not visible to users. Each keyword is indexed for App Store search. Words from **app name + subtitle** are already indexed — repeating them here wastes characters. Singular forms cover plural.

```
football,soccer,sports,club,coach,captain,kitty,dues,locker,fundraiser,hockey,rugby,handball,league
```

Count: **99 / 100**

> What's already covered by name + subtitle: _team, tally, fines, table_. Don't add these.
> Worth considering if you want Icelandic-market lift: swap one English word for `sektir` (Icelandic for "fines") — costs 7 chars.

---

## Description (≤4000 chars)

First ~3 lines are above the "more" fold and do most of the conversion work. Keep them tight.

### Above the fold (first 3 lines)

```
The fine tracker that your team will actually use.

Record fines, settle the kitty, and see who's really leading the team table.

Offline-first. No accounts. No servers. Your data stays on your device.
```

### Body

```
TEAM TALLY IS FOR

Football teams, locker rooms, club nights, fundraisers — anyone with a kitty and a culture of fines.

WHAT YOU CAN TRACK

• One-off fines (late to training, wrong colour socks, phone out during the huddle — write your own)
• Weekly, monthly, or quarterly settlement — pick the rhythm your team already runs on
• Mark players paid as the kitty comes in — no more "did so-and-so pay yet?" texts on a Sunday night
• Double Day specials when you want fines to count twice
• A live leaderboard so the worst offender can never hide
• A per-player history showing every fine, every date, every krónur owed
• Total kitty outstanding, at a glance

WHY OFFLINE

No accounts. No sign-in. No cloud. The captain owns the data, the data lives on the captain's phone, and uninstalling the app deletes it all. That's the whole privacy story.

THE FREEDOM

• Set your own fine types and amounts
• Pick your own currency (works with any)
• Rename your team, your fines, your everything — anytime
• No ads, no tracking, no upsell

Built by a footballer for footballers, but works the same for hockey, rugby, handball, dressing-room karma, anything where someone needs to keep score.
```

Count: ~1100 / 4000 — plenty of headroom. Trim or expand sections to match your voice.

---

## Promotional Text (≤170 chars)

The ONE field that's editable any time without a new submission. Use for time-sensitive things: launch, season starts, new feature post-launch.

```
Season starting? Get the fines flowing. Track training no-shows, late arrivals, and the kitty — all offline, no accounts.
```

Count: **120 / 170**

> Alternates:
>
> - `New: Monthly subs apply themselves on the 1st. Set the amount once, never chase the kitty again.` (95)
> - `The captain's spreadsheet, but actually fun. And it stays on your phone.` (72)

---

## Support URL

```
https://team-tally.app/support
```

## Marketing URL (optional)

```
https://team-tally.app
```

## Privacy Policy URL

```
https://team-tally.app/privacy
```

---

## Notes for the App Review team

Paste verbatim into ASC > App Review Information > Notes:

```
Fully offline app — no account required, no network calls.
All data is stored locally in SQLite on the device.
No sign-in needed; the app is usable immediately on first launch.
Tap "Get started", enter any team name, and the full feature set is available.
```
