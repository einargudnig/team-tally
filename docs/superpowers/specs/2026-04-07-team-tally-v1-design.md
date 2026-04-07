# Team Tally v1 — Design Spec

A mobile app for a team's fine collector to track fines. Single-user, local-first, no auth.

## Approach

Expo app with local SQLite storage. No backend, no accounts, no network calls. Designed so sharing/multi-user can be layered on later without rewriting.

## Data Model

Four tables in SQLite via Drizzle ORM + expo-sqlite:

### Team
| Column    | Type    | Notes                              |
|-----------|---------|------------------------------------|
| id        | text    | UUID, primary key                  |
| name      | text    | Required                           |
| currency  | text    | ISO 4217 code (e.g. "ISK", "EUR") |
| createdAt | integer | Unix timestamp                     |

Single row in v1 (one team per device). Schema supports multiple for future.

### Member
| Column    | Type    | Notes              |
|-----------|---------|--------------------|
| id        | text    | UUID, primary key  |
| teamId    | text    | FK → Team.id       |
| name      | text    | Required           |
| createdAt | integer | Unix timestamp     |

### FineType
| Column      | Type    | Notes                              |
|-------------|---------|------------------------------------|
| id          | text    | UUID, primary key                  |
| teamId      | text    | FK → Team.id                       |
| name        | text    | Required                           |
| description | text    | Optional                           |
| amount      | integer | In smallest currency unit, fixed   |
| createdAt   | integer | Unix timestamp                     |

### FineEntry
| Column     | Type    | Notes                          |
|------------|---------|--------------------------------|
| id         | text    | UUID, primary key              |
| fineTypeId | text    | FK → FineType.id               |
| memberId   | text    | FK → Member.id                 |
| date       | text    | ISO date string (YYYY-MM-DD)   |
| createdAt  | integer | Unix timestamp                 |

### Key Queries
- **Leaderboard**: Group FineEntries by memberId, join FineType for amount, sum per member, order descending.
- **Recent activity**: FineEntries ordered by date desc, join FineType (name, amount) and Member (name).
- **Player detail breakdown**: FineEntries for a member, grouped by fineTypeId with count and total.

## Screens

### Onboarding (first launch only)

Three steps. Steps 2 and 3 reuse the same add-player and add-fine-type components from the main app — not separate onboarding-specific UI.

1. **Team name + currency** — Text input for name, dropdown/picker for currency. Only required step. Creates the Team row.
2. **Add players** — Shows the add-player UI (same component as Players tab). Skippable.
3. **Add fine types** — Shows the add-fine-type UI (same component as Fines tab). Skippable. "Done" completes onboarding.

Onboarding state tracked by whether a Team row exists in the database. Root layout checks this on mount and routes to onboarding or tabs accordingly.

### Tab 1 — Home (Dashboard)

- **Total outstanding** — Sum of all fines, displayed prominently.
- **Leaderboard of shame** — Members ranked by total fines owed. Shows rank, avatar initial, name, total amount. Tapping a member opens Player Detail.
- **Recent activity** — Feed of recent fine entries. Shows member name, fine type name, relative date, amount.
- **FAB (+)** — Opens the Add Fine flow.

### Tab 2 — Players

- List of all team members with their total fine amounts.
- **Add player** — Inline input or bottom sheet. Just a name field.
- Tapping a player opens Player Detail.

### Tab 3 — Fines

- List of all fine types with name, description, and amount.
- **Add fine type** — Form with name (required), description (optional), amount (required).
- Edit/delete existing fine types.

### Tab 4 — Settings

- Edit team name.
- Change currency.
- Future: sharing, export, data management.

### Add Fine Flow (modal/sheet from FAB)

All on a single screen:
1. **Who?** — Tap to select a member (chip/pill UI, single select).
2. **What for?** — Tap to select a fine type from the list.
3. **When?** — Date picker, defaults to today.

Confirm button shows summary: "Fine [Name] — [Amount]". Enabled once member and fine type are selected.

Supports both quick single fines and batch use (after confirming, stays on the screen to add another).

### Player Detail

- Player name and avatar initial.
- Total fines amount.
- **Breakdown** — Grouped by fine type: name, count, subtotal.
- **History** — Chronological list of all fine entries for this player. Shows fine type name and date. Swipe to delete.

## Tech Stack

- **Expo** with Expo Router (file-based routing, tabs layout)
- **expo-sqlite** with Drizzle ORM for type-safe local database
- **NativeWind** (Tailwind CSS for React Native) for styling
- **TypeScript** throughout

No backend, no auth, no network calls in v1.

## File Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root layout (check onboarding state)
│   ├── onboarding/
│   │   ├── _layout.tsx          # Onboarding flow layout
│   │   └── index.tsx            # Step 1: team name + currency
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── players.tsx          # Players list
│   │   ├── fines.tsx            # Fine types list
│   │   └── settings.tsx         # Settings
│   ├── player/
│   │   └── [id].tsx             # Player detail
│   └── add-fine.tsx             # Add fine modal
├── db/
│   ├── schema.ts                # Drizzle schema definitions
│   ├── client.ts                # Database connection setup
│   └── queries.ts               # Reusable query functions
├── components/
│   ├── LeaderboardItem.tsx
│   ├── FineActivityItem.tsx
│   ├── MemberChip.tsx
│   ├── FineTypeRow.tsx
│   └── PlayerAvatar.tsx
├── lib/
│   ├── currency.ts              # Currency list, formatting
│   └── utils.ts                 # Shared utilities
├── app.json                     # Expo config
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Currency Handling

- Stored as ISO 4217 code on Team (e.g. "ISK", "EUR", "USD").
- Amounts stored as integers in smallest unit (e.g. ISK has no subunit so 1000 = 1000 kr; EUR stores cents so 1050 = €10.50).
- Display formatting based on currency code: symbol, position, decimal places, thousands separator.
- Currency selected during onboarding, changeable in Settings.
- Predefined list of common currencies with symbol and decimal info.

## Future Considerations (not in v1)

- **Sharing**: Team sharing via invite link/code. Requires backend (Expo API Routes + hosted DB) and user identity.
- **Payment tracking**: Mark fines as paid.
- **Export**: CSV/PDF export of fines.
- **Multiple teams**: Support for managing more than one team.
- **Notifications**: Remind members about outstanding fines.
