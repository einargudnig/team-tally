# Team Tally — Ship to App Store Checklist

Last updated: 2026-05-12. Everything left to take v1 live, in order.

---

## ✅ Already done

- [x] Apple Developer membership
- [x] ASC App record created (App ID `6764513102`, Team ID `7AWFJS2W5C`)
- [x] `eas.json` wired with ASC + Apple Team IDs
- [x] EAS project linked (`projectId: 76fb9830-...`)
- [x] Privacy policy live at https://team-tally.app/privacy
- [x] Support page live at https://team-tally.app/support
- [x] Apple Distribution Cert + Provisioning Profile generated and cached on EAS
- [x] **Build #3** (`cd80a422-...`, commit `824305c`) finished and submitted to ASC
- [x] Store metadata drafted in `STORE_METADATA.md`
- [x] 5 screenshots captured in `apps/mobile/screenshots/`

> Build #2 had two bugs (onboarding redirect + Add Fine empty rendering). Build #3 fixes both. Use build #3 in ASC — **do not** select build #2.

---

## 1. Verify build #3 lands in TestFlight

Apple processes the uploaded `.ipa` for 10–30 min after EAS submit finishes. You'll get an email titled *"Team Tally — build 3 has completed processing"*.

- [ ] Email received from App Store Connect
- [ ] Build #3 appears at https://appstoreconnect.apple.com/apps/6764513102/testflight/ios as **"Ready to Test"**

If you get an `ITMS-90XXX` error email instead, paste the error to me and we'll fix.

### Optional but recommended: install via TestFlight on your real iPhone

- [ ] Install **TestFlight** from the App Store on your iPhone (if not already)
- [ ] In ASC → TestFlight → Internal Testing → add yourself as an internal tester
- [ ] Open TestFlight on the phone → install Team Tally
- [ ] First-launch sanity check: onboarding works, can create a team, can add a fine, Add Fine sheet shows the form (not blank), no crash-on-launch

This catches anything build #3 might still have. ~15 min, saves a 24h Apple review rejection cycle if something is wrong.

---

## 2. App Information (one-time, left sidebar in ASC)

Open https://appstoreconnect.apple.com → My Apps → Team Tally → **App Information**.

- [ ] **Subtitle**: `The team fine tracker.`
- [ ] **Primary Category**: `Sports`
- [ ] **Secondary Category** (optional): `Social Networking`
- [ ] **Content Rights**: ✓ "Does not contain, show, or access third-party content"
- [ ] **Age Rating** → Edit → answer all **No / None** → result should be **4+**
- [ ] **Privacy Policy URL**: `https://team-tally.app/privacy`

---

## 3. Pricing and Availability (left sidebar)

- [ ] **Price**: Free
- [ ] **Availability**: All countries (or just Iceland for soft launch — your call)

---

## 4. App Privacy (left sidebar)

- [ ] Click **Get Started**
- [ ] **Do you or your third-party partners collect data from this app?** → **No**
- [ ] Save

That's the entire App Privacy section. "Data Not Collected" is legitimate because the privacy manifest in `app.json` declares zero tracking — the app stores everything locally in SQLite.

---

## 5. Version 1.0 — Prepare for Submission (left sidebar)

This is the big one. Open the "1.0 Prepare for Submission" page in the left sidebar.

### Screenshots — drag-and-drop in order

Files live in `apps/mobile/screenshots/` on your laptop. Drag them in **this exact order** (ASC uses upload order):

- [ ] `01-leaderboard.png` — Home / leaderboard hero shot
- [ ] `02-player-detail.png` — Lionel Messi's breakdown
- [ ] `03-add-fine.png` — Add Fine modal with selections
- [ ] `04-fines.png` — Fines catalog
- [ ] `05-double-day.png` — Home with Double Day banner active

ASC class: **6.5" iPhone**. 1290×2796 is accepted (ASC auto-resamples).

### Promotional Text (editable any time, ≤170 chars)

- [ ] Paste:

```
Season starting? Get the fines flowing. Track training no-shows, late arrivals, and the kitty — all offline, no accounts.
```

### Description (≤4000 chars, first 3 lines above the fold)

- [ ] Paste:

```
The fine tracker that your team will actually use.

Record fines, settle the kitty, and see who's really leading the team table.

Offline-first. No accounts. No servers. Your data stays on your device.

TEAM TALLY IS FOR

Football teams, locker rooms, club nights, fundraisers — anyone with a kitty and a culture of fines.

WHAT YOU CAN TRACK

• One-off fines (late to training, wrong colour socks, phone out during the huddle — write your own)
• Monthly subs that apply themselves on the 1st of every month
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

### Keywords (≤100 chars total, comma-separated, NO spaces after commas)

- [ ] Paste:

```
football,soccer,sports,club,coach,captain,kitty,dues,locker,fundraiser,hockey,rugby,handball,league
```

### URLs

- [ ] **Support URL**: `https://team-tally.app/support`
- [ ] **Marketing URL** (optional): `https://team-tally.app`

### Build

- [ ] Scroll to "Build" section → click **+** (or "Select a build")
- [ ] Pick **Build 3 (1.0.0)** ← critical. **Do not** select Build 2.
- [ ] If Build 3 doesn't appear yet: wait, refresh in 5–10 min. Apple's still processing.

### App Review Information

- [ ] **Sign-in required**: **No**
- [ ] **Contact Information**:
  - First name + last name
  - Phone number
  - Email: `team-tally@eggo.is` (or whichever you prefer)
- [ ] **Notes**: paste:

```
Fully offline app — no account required, no network calls.
All data is stored locally in SQLite on the device.
No sign-in needed; the app is usable immediately on first launch.
Tap "Get started", enter any team name, and the full feature set is available.
```

### Version Release

- [ ] Select **Manually release this version**

(Lets you choose the launch moment after Apple approves; otherwise it'd go live the second Apple clicks Approve.)

---

## 6. Submit for Review

Top-right corner of the version page:

- [ ] Click **Add for Review**
- [ ] Review the summary screen
- [ ] Click **Submit for Review**

You'll see a confirmation. Status changes to **Waiting for Review** (then **In Review**, then **Pending Developer Release** if approved).

Average review time these days: ~24h. Solo offline apps with the "no sign-in" note typically clear on first try.

---

## 7. While you wait for review

Nothing to do — Apple's reviewer takes it from here. Set a Slack reminder for ~24h.

If rejected:
- [ ] Read the rejection reason carefully (usually clear and actionable)
- [ ] Fix the issue (could be metadata, screenshots, or code)
- [ ] If code: rebuild via `eas build` + `eas submit` (creates Build 4)
- [ ] In ASC: Reply to the reviewer with what you changed, select the new build, **Submit for Review** again
- [ ] No fees, no penalties for rejection

If approved:
- [ ] You'll get an email — *"Team Tally is ready for sale"* or similar
- [ ] In ASC → 1.0 version page → click **Release this version** to go live whenever you're ready

---

## 8. Post-launch (day 1)

- [ ] Tweet / post launch announcement (or whatever your channel is)
- [ ] Update `apps/web/src/pages/index.astro` if it still says "waitlist" — switch CTA to **App Store** button
- [ ] Update Promotional Text in ASC to a launch-day variant (editable any time)
- [ ] Monitor Apple's App Analytics (in ASC) for downloads + crash reports

---

## Files referenced

| File | Purpose |
|---|---|
| `apps/mobile/STORE_METADATA.md` | Full draft of every text field — copy from here |
| `apps/mobile/SCREENSHOT_PLAN.md` | How the screenshots were composed |
| `apps/mobile/screenshots/0*.png` | The 5 PNGs to drag into ASC |
| `apps/mobile/APP_STORE_SUBMISSION.md` | Original step-by-step walkthrough |

## Where to get help

- TestFlight install issue → `https://help.apple.com/app-store-connect/#/devdc42b26b8` (real link, search "internal testing")
- ITMS error code → search Apple Developer forums or send me the code
- Apple rejection → paste the reason and I'll help craft a response
