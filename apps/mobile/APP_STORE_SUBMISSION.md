# App Store Submission Walkthrough

Step-by-step guide for getting Team Tally onto the App Store via App Store Connect (ASC).

Apple Developer license: ✅ already have it.

Everything below happens at https://appstoreconnect.apple.com — no code involved until step 7.

---

## 1. Create the app record

**My Apps → "+" → New App**

- **Platform**: iOS
- **Name**: `Team Tally` (public App Store name — must be unique across the entire App Store)
- **Primary Language**: English (or Icelandic if that's the primary market — the other can be added as a localization later)
- **Bundle ID**: `is.einar.teamtally` (must match `app.json` exactly — if not in the dropdown, register it first at developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → "+")
- **SKU**: any internal string, e.g. `team-tally-ios` (never shown publicly, can't be changed)
- **User Access**: Full Access

After creating, **note these two values** for `eas.json`:

- **Apple Team ID**: developer.apple.com → top right → Membership Details → Team ID (10 chars, e.g. `A1B2C3D4E5`)
- **ASC App ID**: in the new app, App Information → Apple ID (numeric, e.g. `6471234567`)

## 2. App Information (left sidebar)

- **Subtitle** (≤30 chars) — shows under the app name on the store page
- **Category**: Primary `Sports` or `Social Networking`; Secondary optional
- **Content Rights**: tick "Does not contain, show, or access third-party content"
- **Age Rating** → Edit → questionnaire — answer all "No" / "None" → likely lands at **4+**
- **Privacy Policy URL**: `https://team-tally.app/privacy` (must be publicly reachable — Apple's reviewer will load this)

## 3. Pricing and Availability (left sidebar)

- **Price**: Free
- **Availability**: All countries, or restrict to Iceland initially

## 4. App Privacy (left sidebar)

Click **Get Started**:

- **Do you or your third-party partners collect data from this app?** → **No**

Because the app is fully offline (Drizzle + SQLite, no analytics, no auth), "Data Not Collected" is legitimate and matches the privacy manifest in `app.json`. Don't tick anything else.

## 5. Prepare the iOS version (left sidebar → "1.0 Prepare for Submission")

Required fields:

- **Screenshots** — 6.5" iPhone mandatory. 3–10 screenshots, 1284×2778 or 1242×2688 px. Take these on the simulator with `Cmd+S` or a real device. Submission is blocked without them.
- **Promotional Text** (≤170 chars) — editable any time without re-review
- **Description** (≤4000 chars) — first ~3 lines are what shows above the "more" fold
- **Keywords** (≤100 chars, comma-separated, no spaces after commas — spaces waste characters)
- **Support URL** — required, can be the landing page or a `/support` route
- **Marketing URL** — optional, the landing page
- **Build** — empty until uploaded via EAS (step 7)
- **App Review Information**:
  - Sign-in required: **No**
  - Contact info: name, phone, email
  - Notes: *"Fully offline app — no account required, no network calls."*
- **Version Release**: "Manually release" for v1 to control the launch moment

## 6. TestFlight (optional, recommended)

- Left sidebar → **TestFlight**
- After step 7's build uploads, install via the TestFlight app on a real device
- Internal testing (up to 100 team members) requires no review — usable ~10–30 min after build processes
- Catches crash-on-launch bugs that would otherwise cost a week of review turnaround

## 7. Code-side: build and submit

After step 1 produced the Team ID and ASC App ID:

```bash
# Replace the two placeholders in apps/mobile/eas.json
"ascAppId": "<your numeric ASC App ID>"
"appleTeamId": "<your 10-char Team ID>"

# Then, from apps/mobile:
bun x eas login
bun x eas init                                              # writes projectId into app.json
bun x eas build --platform ios --profile production         # ~15–25 min in the cloud
bun x eas submit --platform ios --profile production --latest
```

After `eas submit`, the build appears under TestFlight and as a selectable "Build" on the version page (~15–30 min processing). Then in ASC: **Add for Review** → **Submit for Review**.

## 8. Review

- Average review currently ~24h
- Rejection → fix and resubmit, no fee, no penalty
- Most common rejections for an app like this: privacy policy URL broken/inaccessible, screenshots that don't match actual app, reviewer requests demo account when none is needed (the reviewer note in step 5 prevents this last one)

---

## Things to draft before opening ASC

These are the parts where taste matters and that are painful to change later:

- **Subtitle** (≤30 chars) — drives App Store search; only changeable per version submission
- **Keywords** (≤100 chars total) — same constraint; pick ~8–12 high-signal ones
- **Description first 3 lines** — what users see before tapping "more"; the rest gets ignored by ~90% of viewers
- **Promotional text** (≤170 chars) — the *one* field that's editable any time, so use it for anything time-sensitive (launch promo, new feature highlight)

## Gotchas worth remembering

- **Bundle ID is permanent.** Once `is.einar.teamtally` is locked to the ASC record, it cannot be renamed. Triple-check before saving.
- **Subtitle is weighted heavily for ASO** and unlike keywords, it's visible to users — don't waste it on marketing fluff.
- **No-account apps get faster reviews.** The "no sign-in required" reviewer note typically clears review on first try.
- **`appVersionSource: "remote"`** in `eas.json` means EAS owns the build number — production builds auto-increment server-side. No need to bump `buildNumber` in `app.json` manually.
