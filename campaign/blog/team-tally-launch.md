---
title: "I built a fines app for football teams — and gave it no backend"
description: "Team Tally is a fine tracker for sports teams. No accounts, no cloud, no server. Here's why offline-first was the whole point."
date: 2026-06-23
tags: [team-tally, indie, offline-first, react-native, building]
draft: true
coverImage: /images/team-tally-hero.png   # use campaign/assets/01-hero-desktop.png
---

> Reading source for the **einargudni.com** post. That site is Next.js with
> hand-written `.tsx` pages (no Markdown pipeline), so the actual drop-in is
> `team-tally-launch.page.tsx` next to this file — paste it into a new route
> (e.g. `app/writing/team-tally/page.tsx`). Fill the two `[[ ... ]]` spots with
> your own details — the post works without them, but it's better with them.

Every grassroots football team I've ever been near runs a fines kitty. Late to
training, forgot your shinpads, phone out during the team talk, a haircut nobody
asked for — there's a price for everything, and the money goes into a pot that
funds the end-of-season blowout.

And every single one of those teams tracks it in the same place: a doomed,
half-abandoned spreadsheet that one person owns, nobody else can find, and which is
always three weeks out of date. By August it's a forensic exercise. *Did Jón ever
pay that 2.500 for the red socks? Nobody knows. Jón says he did.*

So I built **[Team Tally](https://teamtally.is)** — a fine tracker that lives where
the fines actually happen: in someone's hand, in the dressing room. It launches
today, free, on iOS and Android.

## What it does

The whole app is built around how a captain actually behaves on matchday:

- **Log a fine in two taps.** Pick the player, pick the offence. You define the
  offences and the amounts — every team's culture is its own.
- **A live leaderboard.** It ranks the squad by who owes the most, in real time. The
  worst offender has nowhere to hide, which turns out to be 90% of the fun.
- **Settle the kitty period by period.** Weekly, monthly, or by season — whatever
  rhythm your team already runs on. Mark people paid as the cash comes in, so you're
  never sending "did you ever pay me?" texts on a Sunday night.

That's it. It does one thing, for one person, and it does it without asking you to
sign up for anything.

## The part I'm actually proud of: there is no backend

Here's the decision the whole app hangs on. Team Tally has **no accounts, no cloud,
no server.** Everything lives in a local SQLite database on the captain's phone. No
login screen. No "invite your teammates." No sync.

Uninstall the app and the data is gone. That is the entire privacy policy, and I can
explain it in one sentence to a 50-year-old club treasurer who does not care about
your data-processing agreement.

It would have been *easy* to add a backend. It's the default — spin up a database,
bolt on auth, sync everything, call it "multiplayer." But think about who uses this
thing: one person, on a phone, often in a basement changing room with no signal,
logging a fine thirty seconds before kickoff. For that user, a backend is pure
downside:

- **Friction.** An account screen is where casual tools go to die. The fastest path
  to "this isn't worth it" is making someone create a password before they've fined
  anyone.
- **A liability.** The moment you hold other people's data on a server, you've signed
  up for breaches, GDPR, an ongoing bill, and a thing that can go down. For a side
  project meant to be fun, that's a lot of rope.
- **It breaks the one place it's used.** Offline-first isn't a feature I bolted on;
  it's a consequence of having nothing to be online *for*. The dressing room has no
  wifi and that's fine, because the app never needed it.

There's a quiet argument here for boring, local, offline-first software. Not
everything needs to be a platform. Some things should just be a good tool that sits
on your phone and works.

## Why football, why Iceland, why now

I'm starting where the problem is sharpest: Iceland's lower divisions — 4. and 5.
deild karla, 2. deild kvenna. Small clubs, strong fine culture, and almost all of
them currently fighting that spreadsheet. [[Optional: drop in your own story here —
the team you played for, the specific fine that started this, the spreadsheet that
finally broke you.]]

It's mid-season, which is exactly when the kitty matters most and exactly when the
spreadsheet has fallen apart. Good time to hand people something better.

The kitty is universal, though. Rugby, handball, hockey, a five-a-side group, a
climbing gym, a stag do — anywhere there's a culture of fines and a pot of money,
Team Tally works. [[Optional: a line about where you want to take it next — but keep
it honest, no roadmap theatre.]]

## Get it

It's free. It works offline. It asks you for nothing.

- 📱 **[teamtally.is](https://teamtally.is)** — links to the App Store and Play Store
- Built with Expo / React Native and Drizzle over SQLite, if you care about that sort
  of thing (I do).

If you run a team's kitty, give it a go this weekend and tell me what breaks. And if
you know a captain still wrestling a spreadsheet — send them this.
