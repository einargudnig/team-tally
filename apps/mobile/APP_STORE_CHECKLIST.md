# App Store Publishing Checklist

## Prerequisites (Apple side)

- [ ] Apple Developer Program membership ($99/yr)
- [ ] Create app record in App Store Connect with bundle ID `is.einar.teamtally`
- [ ] Note your **Apple Team ID** (Developer > Membership)
- [ ] Note your **ASC App ID** (numeric ID from App Store Connect > App Information)

## EAS Setup

- [ ] Fill in `ascAppId` in `eas.json:21`
- [ ] Fill in `appleTeamId` in `eas.json:22`
- [ ] Run `bun x eas login`
- [ ] Run `bun x eas init` (links project, writes `projectId` into `app.json`)

## Build & Submit

- [ ] `bun x eas build --platform ios --profile production`
- [ ] `bun x eas submit --platform ios --profile production --latest`

## App Store Connect Metadata

- [ ] Screenshots (6.5" iPhone required)
- [ ] App description + keywords
- [ ] Support URL
- [ ] Marketing URL (landing page)
- [ ] Privacy policy URL (deploy `privacy.astro` first)
- [ ] Age rating questionnaire
- [ ] App Privacy section: declare **"Data Not Collected"**
- [ ] Pricing & availability

## Recommended

- [ ] TestFlight beta round before submitting for review

## Already Done

- [x] `supportsTablet` set to `false`
- [x] `usesNonExemptEncryption: false` added to iOS config
- [x] Privacy manifest declared in `app.json` (zero tracking, standard reason codes)
