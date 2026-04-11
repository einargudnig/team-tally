# Team Tally v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Expo mobile app for a team fine collector to track fines — no auth, no backend.

**Architecture:** Single Expo app using Expo Router (file-based routing with tabs). SQLite via expo-sqlite + Drizzle ORM for persistence. Onboarding state determined by whether a Team row exists in the database. All data local to device.

**Tech Stack:** Expo SDK 53, Expo Router, expo-sqlite, drizzle-orm, NativeWind v5 (Tailwind for RN), TypeScript

**Design Spec:** `docs/superpowers/specs/2026-04-07-team-tally-v1-design.md`

**Installed Skills:** building-native-ui, expo-tailwind-setup, react-native-best-practices, sleek-design-mobile-apps, mobile-ios-design, mobile-android-design — invoke these when implementing UI tasks.

---

### Task 1: Scaffold Expo App

**Files:**

- Create: `apps/mobile/` (entire Expo project via `create-expo-app`)
- Modify: `package.json` (root — add dev:mobile script)

- [ ] **Step 1: Create Expo app**

```bash
cd apps && npx create-expo-app@latest mobile --template tabs
```

This scaffolds a new Expo project with tabs template, Expo Router, and TypeScript preconfigured.

- [ ] **Step 2: Verify it runs**

```bash
cd apps/mobile && npx expo start
```

Expected: Metro bundler starts, QR code shown. Press `i` for iOS simulator or `a` for Android. Verify the default tabs app loads.

- [ ] **Step 3: Clean up template boilerplate**

Remove the template's example screens and components. We'll replace them with our own. Delete:

- `apps/mobile/app/(tabs)/index.tsx` (replace with our dashboard)
- `apps/mobile/app/(tabs)/explore.tsx` (not needed)
- `apps/mobile/components/` (all template components)
- `apps/mobile/constants/` (we'll use our own)
- `apps/mobile/hooks/` (template hooks)
- `apps/mobile/assets/images/` (template images, keep `assets/` dir)

Keep:

- `apps/mobile/app/_layout.tsx` (we'll modify it)
- `apps/mobile/app/(tabs)/_layout.tsx` (we'll modify it)
- `apps/mobile/app.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/package.json`

- [ ] **Step 4: Add dev:mobile script to root package.json**

Add to the root `package.json` scripts:

```json
"dev:mobile": "bun run --filter @team-tally/mobile dev"
```

Also update `apps/mobile/package.json` to set the name to `@team-tally/mobile` so the workspace filter works.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/ package.json
git commit -m "chore: scaffold Expo app with tabs template"
```

---

### Task 2: Set Up NativeWind (Tailwind for React Native)

**Files:**

- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/metro.config.js`
- Create: `apps/mobile/postcss.config.mjs`
- Create: `apps/mobile/global.css`
- Modify: `apps/mobile/app/_layout.tsx`

**Reference:** Invoke the `expo-tailwind-setup` skill for exact setup steps. The skill has the most up-to-date installation instructions for NativeWind v5.

- [ ] **Step 1: Install NativeWind v5 dependencies**

```bash
cd apps/mobile
npx expo install nativewind tailwindcss react-native-reanimated
npm install --save-dev @tailwindcss/postcss
```

Note: The expo-tailwind-setup skill may specify different exact versions — follow the skill's instructions.

- [ ] **Step 2: Create metro.config.js**

Follow the expo-tailwind-setup skill for the exact Metro config. It will use `withNativewind` to wrap the Metro config.

- [ ] **Step 3: Create postcss.config.mjs**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 4: Create global.css**

```css
@import "tailwindcss";
```

- [ ] **Step 5: Import global.css in root layout**

In `apps/mobile/app/_layout.tsx`, add at the top:

```typescript
import "../global.css";
```

- [ ] **Step 6: Verify Tailwind works**

Create a temporary test in `apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { View, Text } from "react-native";

export default function TestScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-2xl font-bold">Tailwind Works!</Text>
    </View>
  );
}
```

Run `npx expo start`, verify styled text appears. Remove this test file after confirming.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/
git commit -m "chore: set up NativeWind v5 with Tailwind CSS"
```

---

### Task 3: Database Schema and Client

**Files:**

- Create: `apps/mobile/db/schema.ts`
- Create: `apps/mobile/db/client.ts`
- Modify: `apps/mobile/package.json` (add drizzle deps)

- [ ] **Step 1: Install database dependencies**

```bash
cd apps/mobile
npx expo install expo-sqlite
npm install drizzle-orm
npm install --save-dev drizzle-kit
```

- [ ] **Step 2: Create Drizzle schema**

Create `apps/mobile/db/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const fineTypes = sqliteTable("fine_types", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  name: text("name").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const fineEntries = sqliteTable("fine_entries", {
  id: text("id").primaryKey(),
  fineTypeId: text("fine_type_id")
    .notNull()
    .references(() => fineTypes.id),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id),
  date: text("date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
```

- [ ] **Step 3: Create database client**

Create `apps/mobile/db/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("team-tally.db");

export const db = drizzle(expoDb, { schema });
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/db/
git commit -m "feat: add SQLite database schema and client"
```

---

### Task 4: Database Query Functions

**Files:**

- Create: `apps/mobile/db/queries.ts`

- [ ] **Step 1: Create query functions**

Create `apps/mobile/db/queries.ts`:

```typescript
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./client";
import { teams, members, fineTypes, fineEntries } from "./schema";
import * as crypto from "expo-crypto";

function uuid() {
  return crypto.randomUUID();
}

// === Team ===

export async function getTeam() {
  const result = await db.select().from(teams).limit(1);
  return result[0] ?? null;
}

export async function createTeam(name: string, currency: string) {
  const id = uuid();
  await db.insert(teams).values({
    id,
    name,
    currency,
    createdAt: new Date(),
  });
  return id;
}

export async function updateTeam(id: string, data: { name?: string; currency?: string }) {
  await db.update(teams).set(data).where(eq(teams.id, id));
}

// === Members ===

export async function getMembers(teamId: string) {
  return db.select().from(members).where(eq(members.teamId, teamId));
}

export async function createMember(teamId: string, name: string) {
  const id = uuid();
  await db.insert(members).values({
    id,
    teamId,
    name,
    createdAt: new Date(),
  });
  return id;
}

export async function deleteMember(id: string) {
  await db.delete(fineEntries).where(eq(fineEntries.memberId, id));
  await db.delete(members).where(eq(members.id, id));
}

// === Fine Types ===

export async function getFineTypes(teamId: string) {
  return db.select().from(fineTypes).where(eq(fineTypes.teamId, teamId));
}

export async function createFineType(
  teamId: string,
  name: string,
  amount: number,
  description?: string
) {
  const id = uuid();
  await db.insert(fineTypes).values({
    id,
    teamId,
    name,
    description: description ?? null,
    amount,
    createdAt: new Date(),
  });
  return id;
}

export async function updateFineType(
  id: string,
  data: { name?: string; amount?: number; description?: string | null }
) {
  await db.update(fineTypes).set(data).where(eq(fineTypes.id, id));
}

export async function deleteFineType(id: string) {
  await db.delete(fineEntries).where(eq(fineEntries.fineTypeId, id));
  await db.delete(fineTypes).where(eq(fineTypes.id, id));
}

// === Fine Entries ===

export async function createFineEntry(fineTypeId: string, memberId: string, date: string) {
  const id = uuid();
  await db.insert(fineEntries).values({
    id,
    fineTypeId,
    memberId,
    date,
    createdAt: new Date(),
  });
  return id;
}

export async function deleteFineEntry(id: string) {
  await db.delete(fineEntries).where(eq(fineEntries.id, id));
}

// === Dashboard Queries ===

export async function getLeaderboard(teamId: string) {
  const result = await db.all<{
    memberId: string;
    memberName: string;
    total: number;
  }>(sql`
    SELECT
      m.id as memberId,
      m.name as memberName,
      COALESCE(SUM(ft.amount), 0) as total
    FROM members m
    LEFT JOIN fine_entries fe ON fe.member_id = m.id
    LEFT JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE m.team_id = ${teamId}
    GROUP BY m.id, m.name
    ORDER BY total DESC
  `);
  return result;
}

export async function getRecentActivity(teamId: string, limit = 20) {
  const result = await db.all<{
    id: string;
    memberName: string;
    fineTypeName: string;
    amount: number;
    date: string;
  }>(sql`
    SELECT
      fe.id,
      m.name as memberName,
      ft.name as fineTypeName,
      ft.amount,
      fe.date
    FROM fine_entries fe
    JOIN members m ON m.id = fe.member_id
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE m.team_id = ${teamId}
    ORDER BY fe.date DESC, fe.created_at DESC
    LIMIT ${limit}
  `);
  return result;
}

export async function getTotalOutstanding(teamId: string) {
  const result = await db.all<{ total: number }>(sql`
    SELECT COALESCE(SUM(ft.amount), 0) as total
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    JOIN members m ON m.id = fe.member_id
    WHERE m.team_id = ${teamId}
  `);
  return result[0]?.total ?? 0;
}

export async function getPlayerDetail(memberId: string) {
  const breakdown = await db.all<{
    fineTypeId: string;
    fineTypeName: string;
    amount: number;
    count: number;
    subtotal: number;
  }>(sql`
    SELECT
      ft.id as fineTypeId,
      ft.name as fineTypeName,
      ft.amount,
      COUNT(*) as count,
      COUNT(*) * ft.amount as subtotal
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE fe.member_id = ${memberId}
    GROUP BY ft.id, ft.name, ft.amount
    ORDER BY subtotal DESC
  `);

  const history = await db.all<{
    id: string;
    fineTypeName: string;
    date: string;
    amount: number;
  }>(sql`
    SELECT
      fe.id,
      ft.name as fineTypeName,
      fe.date,
      ft.amount
    FROM fine_entries fe
    JOIN fine_types ft ON ft.id = fe.fine_type_id
    WHERE fe.member_id = ${memberId}
    ORDER BY fe.date DESC, fe.created_at DESC
  `);

  return { breakdown, history };
}
```

- [ ] **Step 2: Install expo-crypto**

```bash
cd apps/mobile && npx expo install expo-crypto
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/db/queries.ts
git commit -m "feat: add database query functions"
```

---

### Task 5: Currency Utilities

**Files:**

- Create: `apps/mobile/lib/currency.ts`

- [ ] **Step 1: Create currency module**

Create `apps/mobile/lib/currency.ts`:

```typescript
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: "before" | "after";
}

export const currencies: CurrencyInfo[] = [
  { code: "ISK", symbol: "kr", name: "Icelandic Króna", decimals: 0, symbolPosition: "after" },
  { code: "USD", symbol: "$", name: "US Dollar", decimals: 2, symbolPosition: "before" },
  { code: "EUR", symbol: "€", name: "Euro", decimals: 2, symbolPosition: "before" },
  { code: "GBP", symbol: "£", name: "British Pound", decimals: 2, symbolPosition: "before" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", decimals: 2, symbolPosition: "after" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", decimals: 2, symbolPosition: "after" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", decimals: 2, symbolPosition: "after" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar", decimals: 2, symbolPosition: "before" },
  { code: "AUD", symbol: "$", name: "Australian Dollar", decimals: 2, symbolPosition: "before" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2, symbolPosition: "before" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0, symbolPosition: "before" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty", decimals: 2, symbolPosition: "after" },
];

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencies.find((c) => c.code === code) ?? currencies[1]; // fallback USD
}

export function formatAmount(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const value = info.decimals > 0 ? amount / Math.pow(10, info.decimals) : amount;

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  });

  if (info.symbolPosition === "before") {
    return `${info.symbol}${formatted}`;
  }
  return `${formatted} ${info.symbol}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/lib/
git commit -m "feat: add currency utilities and formatting"
```

---

### Task 6: Root Layout and Onboarding Router

**Files:**

- Modify: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/onboarding/_layout.tsx`
- Create: `apps/mobile/app/onboarding/index.tsx`

- [ ] **Step 1: Create root layout with onboarding check**

Replace `apps/mobile/app/_layout.tsx`:

```tsx
import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getTeam } from "../db/queries";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function check() {
      const team = await getTeam();
      setHasTeam(!!team);
      setIsLoading(false);
    }
    check();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!hasTeam && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasTeam && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isLoading, hasTeam, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#5b5bf7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-fine"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="player/[id]"
        options={{
          headerShown: true,
          title: "Player",
        }}
      />
    </Stack>
  );
}
```

- [ ] **Step 2: Create onboarding layout**

Create `apps/mobile/app/onboarding/_layout.tsx`:

```tsx
import { Stack } from "expo-router/stack";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
```

- [ ] **Step 3: Create onboarding screen (Step 1: team name + currency)**

Create `apps/mobile/app/onboarding/index.tsx`:

```tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView } from "react-native";
import { useRouter } from "expo-router";
import { createTeam } from "../../db/queries";
import { currencies } from "../../lib/currency";

export default function OnboardingScreen() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ISK");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const selectedInfo = currencies.find((c) => c.code === selectedCurrency)!;

  async function handleContinue() {
    if (!teamName.trim()) return;
    await createTeam(teamName.trim(), selectedCurrency);
    router.replace("/(tabs)/players");
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-5xl mb-4">⚽</Text>
          <Text className="text-white text-2xl font-bold mb-2">What's your team called?</Text>
          <Text className="text-gray-500 text-sm">You can always change this later</Text>
        </View>

        <TextInput
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base mb-4"
          placeholder="Team name"
          placeholderTextColor="#666"
          value={teamName}
          onChangeText={setTeamName}
          autoFocus
          returnKeyType="next"
        />

        <Pressable
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 mb-4 flex-row justify-between items-center"
        >
          <Text className="text-gray-400 text-sm">Currency</Text>
          <Text className="text-white text-base">
            {selectedInfo.code} {selectedInfo.symbol}
          </Text>
        </Pressable>

        {showCurrencyPicker && (
          <View className="bg-gray-900 border border-gray-700 rounded-xl mb-4 max-h-48 overflow-hidden">
            <ScrollView nestedScrollEnabled>
              {currencies.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setSelectedCurrency(c.code);
                    setShowCurrencyPicker(false);
                  }}
                  className={`px-4 py-3 border-b border-gray-800 ${
                    c.code === selectedCurrency ? "bg-indigo-900/30" : ""
                  }`}
                >
                  <Text className="text-white text-base">
                    {c.symbol} — {c.name} ({c.code})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Pressable
          onPress={handleContinue}
          disabled={!teamName.trim()}
          className={`rounded-xl py-4 items-center mt-4 ${
            teamName.trim() ? "bg-indigo-600" : "bg-gray-800"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              teamName.trim() ? "text-white" : "text-gray-600"
            }`}
          >
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

Note: After creating the team, this navigates to the Players tab so the user can add players using the normal UI. The onboarding "steps 2 and 3" are just the normal Players and Fines tabs.

- [ ] **Step 4: Verify onboarding flow**

Run `npx expo start`. On first launch (no team in DB), the onboarding screen should appear. After entering a team name and tapping Continue, it should navigate to the tabs. On subsequent launches, it should go straight to tabs.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/
git commit -m "feat: add root layout with onboarding routing"
```

---

### Task 7: Tab Layout

**Files:**

- Modify: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx` (placeholder)
- Create: `apps/mobile/app/(tabs)/players.tsx` (placeholder)
- Create: `apps/mobile/app/(tabs)/fines.tsx` (placeholder)
- Create: `apps/mobile/app/(tabs)/settings.tsx` (placeholder)

- [ ] **Step 1: Create tab layout**

Replace `apps/mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#5b5bf7",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#0d0d1a",
          borderTopColor: "#1a1a2e",
        },
        headerStyle: {
          backgroundColor: "#0d0d1a",
        },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabIcon name="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Players",
          tabBarIcon: ({ color }) => <TabIcon name="👥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fines"
        options={{
          title: "Fines",
          tabBarIcon: ({ color }) => <TabIcon name="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabIcon name="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name }: { name: string; color: string }) {
  return <Text style={{ fontSize: 20 }}>{name}</Text>;
}

import { Text } from "react-native";
```

- [ ] **Step 2: Create placeholder screens**

Create each tab screen with a minimal placeholder so the app compiles.

`apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-xl">Dashboard</Text>
    </View>
  );
}
```

`apps/mobile/app/(tabs)/players.tsx`:

```tsx
import { View, Text } from "react-native";

export default function PlayersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-xl">Players</Text>
    </View>
  );
}
```

`apps/mobile/app/(tabs)/fines.tsx`:

```tsx
import { View, Text } from "react-native";

export default function FinesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-xl">Fines</Text>
    </View>
  );
}
```

`apps/mobile/app/(tabs)/settings.tsx`:

```tsx
import { View, Text } from "react-native";

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-xl">Settings</Text>
    </View>
  );
}
```

- [ ] **Step 3: Verify tabs render**

Run `npx expo start`. Should show 4 tabs with correct icons and labels. Each tab shows its placeholder text.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/
git commit -m "feat: add tab layout with 4 tabs"
```

---

### Task 8: Players Tab (Add & List Members)

**Files:**

- Modify: `apps/mobile/app/(tabs)/players.tsx`
- Create: `apps/mobile/components/player-avatar.tsx`

- [ ] **Step 1: Create PlayerAvatar component**

Create `apps/mobile/components/player-avatar.tsx`:

```tsx
import { View, Text } from "react-native";

interface PlayerAvatarProps {
  name: string;
  size?: number;
}

export function PlayerAvatar({ name, size = 40 }: PlayerAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <View
      className="bg-indigo-900/50 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Text className="text-indigo-300 font-semibold" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Build Players screen**

Replace `apps/mobile/app/(tabs)/players.tsx`:

```tsx
import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, FlatList, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getTeam, getMembers, createMember, deleteMember } from "../../db/queries";
import { PlayerAvatar } from "../../components/player-avatar";

interface Member {
  id: string;
  name: string;
  teamId: string;
  createdAt: Date;
}

export default function PlayersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const team = await getTeam();
    if (!team) return;
    setTeamId(team.id);
    const result = await getMembers(team.id);
    setMembers(result);
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name || !teamId) return;
    await createMember(teamId, name);
    setNewName("");
    await loadData();
  }

  function handleDelete(member: Member) {
    Alert.alert("Remove Player", `Remove ${member.name} and all their fines?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteMember(member.id);
          await loadData();
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-black">
      {/* Add player input */}
      <View className="flex-row items-center px-4 py-3 gap-3 border-b border-gray-900">
        <TextInput
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-base"
          placeholder="Add player name"
          placeholderTextColor="#666"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAdd}
          disabled={!newName.trim()}
          className={`rounded-xl px-5 py-3 ${newName.trim() ? "bg-indigo-600" : "bg-gray-800"}`}
        >
          <Text className={`font-semibold ${newName.trim() ? "text-white" : "text-gray-600"}`}>
            Add
          </Text>
        </Pressable>
      </View>

      {/* Player list */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/player/${item.id}`)}
            onLongPress={() => handleDelete(item)}
            className="flex-row items-center gap-3 bg-gray-900/50 rounded-xl px-4 py-3 mb-2"
          >
            <PlayerAvatar name={item.name} size={36} />
            <Text className="text-white text-base flex-1">{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-600 text-base">No players yet</Text>
            <Text className="text-gray-700 text-sm mt-1">Add your first player above</Text>
          </View>
        }
      />
    </View>
  );
}
```

- [ ] **Step 3: Verify**

Run the app. Navigate to Players tab. Add a few players, verify they appear in the list. Long-press to delete one. Verify the list updates.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(tabs)/players.tsx apps/mobile/components/
git commit -m "feat: add Players tab with add/list/delete"
```

---

### Task 9: Fines Tab (Fine Types Management)

**Files:**

- Modify: `apps/mobile/app/(tabs)/fines.tsx`

- [ ] **Step 1: Build Fines screen**

Replace `apps/mobile/app/(tabs)/fines.tsx`:

```tsx
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { getTeam, getFineTypes, createFineType, deleteFineType } from "../../db/queries";
import { formatAmount } from "../../lib/currency";

interface FineType {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  teamId: string;
  createdAt: Date;
}

export default function FinesScreen() {
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [showForm, setShowForm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const team = await getTeam();
    if (!team) return;
    setTeamId(team.id);
    setCurrency(team.currency);
    const result = await getFineTypes(team.id);
    setFineTypesList(result);
  }

  async function handleAdd() {
    const trimmedName = name.trim();
    const parsedAmount = parseInt(amount, 10);
    if (!trimmedName || !parsedAmount || !teamId) return;

    await createFineType(teamId, trimmedName, parsedAmount, description.trim() || undefined);
    setName("");
    setDescription("");
    setAmount("");
    setShowForm(false);
    await loadData();
  }

  function handleDelete(ft: FineType) {
    Alert.alert("Delete Fine Type", `Delete "${ft.name}" and all entries using it?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFineType(ft.id);
          await loadData();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-black">
      {/* Add button */}
      {!showForm && (
        <Pressable
          onPress={() => setShowForm(true)}
          className="mx-4 mt-3 mb-1 border border-dashed border-gray-700 rounded-xl py-3 items-center"
        >
          <Text className="text-gray-500 text-base">+ Add fine type</Text>
        </Pressable>
      )}

      {/* Add form */}
      {showForm && (
        <View className="mx-4 mt-3 mb-1 bg-gray-900 rounded-xl p-4 gap-3">
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            placeholder="Fine name (e.g. Late to practice)"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            placeholder="Description (optional)"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            placeholder="Amount"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                setShowForm(false);
                setName("");
                setDescription("");
                setAmount("");
              }}
              className="flex-1 rounded-lg py-3 items-center bg-gray-800"
            >
              <Text className="text-gray-400 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!name.trim() || !amount}
              className={`flex-1 rounded-lg py-3 items-center ${
                name.trim() && amount ? "bg-indigo-600" : "bg-gray-800"
              }`}
            >
              <Text
                className={`font-semibold ${
                  name.trim() && amount ? "text-white" : "text-gray-600"
                }`}
              >
                Add
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Fine types list */}
      <FlatList
        data={fineTypesList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleDelete(item)}
            className="bg-gray-900/50 rounded-xl px-4 py-3 mb-2 flex-row justify-between items-center"
          >
            <View className="flex-1 mr-3">
              <Text className="text-white text-base font-medium">{item.name}</Text>
              {item.description && (
                <Text className="text-gray-500 text-sm mt-0.5">{item.description}</Text>
              )}
            </View>
            <Text className="text-indigo-400 font-semibold">
              {formatAmount(item.amount, currency)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-600 text-base">No fine types yet</Text>
            <Text className="text-gray-700 text-sm mt-1">Add your first fine type above</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Verify**

Run the app. Navigate to Fines tab. Add a fine type with name and amount. Verify it appears in the list with formatted currency. Long-press to delete.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(tabs)/fines.tsx
git commit -m "feat: add Fines tab with fine type management"
```

---

### Task 10: Home Dashboard

**Files:**

- Modify: `apps/mobile/app/(tabs)/index.tsx`
- Create: `apps/mobile/components/leaderboard-item.tsx`
- Create: `apps/mobile/components/fine-activity-item.tsx`

- [ ] **Step 1: Create LeaderboardItem component**

Create `apps/mobile/components/leaderboard-item.tsx`:

```tsx
import { Pressable, View, Text } from "react-native";
import { PlayerAvatar } from "./player-avatar";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  total: string;
  onPress: () => void;
}

function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-amber-600";
  return "text-gray-600";
}

export function LeaderboardItem({ rank, name, total, onPress }: LeaderboardItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-gray-900/50 rounded-xl px-3 py-3 mb-1.5"
    >
      <Text className={`font-bold w-6 text-center ${getRankColor(rank)}`}>{rank}</Text>
      <View className="ml-2">
        <PlayerAvatar name={name} size={32} />
      </View>
      <Text className="text-white text-sm ml-3 flex-1">{name}</Text>
      <Text className="text-red-400 font-semibold text-sm">{total}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create FineActivityItem component**

Create `apps/mobile/components/fine-activity-item.tsx`:

```tsx
import { View, Text } from "react-native";

interface FineActivityItemProps {
  memberName: string;
  fineTypeName: string;
  amount: string;
  date: string;
}

export function FineActivityItem({
  memberName,
  fineTypeName,
  amount,
  date,
}: FineActivityItemProps) {
  return (
    <View className="flex-row justify-between items-center bg-gray-900/50 rounded-xl px-3 py-2.5 mb-1.5">
      <View className="flex-1">
        <Text className="text-white text-sm">
          <Text className="font-semibold">{memberName}</Text> · {fineTypeName}
        </Text>
        <Text className="text-gray-600 text-xs mt-0.5">{date}</Text>
      </View>
      <Text className="text-red-400 text-sm">{amount}</Text>
    </View>
  );
}
```

- [ ] **Step 3: Build Home dashboard screen**

Replace `apps/mobile/app/(tabs)/index.tsx`:

```tsx
import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getTeam, getLeaderboard, getRecentActivity, getTotalOutstanding } from "../../db/queries";
import { formatAmount } from "../../lib/currency";
import { LeaderboardItem } from "../../components/leaderboard-item";
import { FineActivityItem } from "../../components/fine-activity-item";

function formatRelativeDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HomeScreen() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [total, setTotal] = useState(0);
  const [leaderboard, setLeaderboard] = useState<
    { memberId: string; memberName: string; total: number }[]
  >([]);
  const [recent, setRecent] = useState<
    { id: string; memberName: string; fineTypeName: string; amount: number; date: string }[]
  >([]);
  const [memberCount, setMemberCount] = useState(0);
  const [fineTypeCount, setFineTypeCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const team = await getTeam();
    if (!team) return;
    setTeamName(team.name);
    setCurrency(team.currency);

    const [totalResult, leaderboardResult, recentResult] = await Promise.all([
      getTotalOutstanding(team.id),
      getLeaderboard(team.id),
      getRecentActivity(team.id),
    ]);

    setTotal(totalResult);
    setLeaderboard(leaderboardResult);
    setRecent(recentResult);
    setMemberCount(leaderboardResult.length);
  }

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-white text-xl font-bold">{teamName}</Text>
            <Text className="text-gray-500 text-sm">
              {memberCount} player{memberCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Total Outstanding */}
        <View className="bg-indigo-900/40 rounded-2xl py-5 px-4 items-center mb-5">
          <Text className="text-indigo-300/70 text-xs uppercase tracking-wider">
            Total Outstanding
          </Text>
          <Text className="text-white text-3xl font-bold mt-1">
            {formatAmount(total, currency)}
          </Text>
        </View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View className="mb-5">
            <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">
              Leaderboard of Shame
            </Text>
            {leaderboard.map((item, index) => (
              <LeaderboardItem
                key={item.memberId}
                rank={index + 1}
                name={item.memberName}
                total={formatAmount(item.total, currency)}
                onPress={() => router.push(`/player/${item.memberId}`)}
              />
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {recent.length > 0 && (
          <View className="mb-5">
            <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">Recent</Text>
            {recent.map((item) => (
              <FineActivityItem
                key={item.id}
                memberName={item.memberName}
                fineTypeName={item.fineTypeName}
                amount={formatAmount(item.amount, currency)}
                date={formatRelativeDate(item.date)}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {leaderboard.length === 0 && recent.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-gray-600 text-base">No fines recorded yet</Text>
            <Text className="text-gray-700 text-sm mt-1">Tap + to add the first fine</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/add-fine")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center"
        style={{
          shadowColor: "#5b5bf7",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Verify**

Run the app. Home tab should show team name, total outstanding card, leaderboard, and recent activity (if fines exist). FAB should be visible in bottom-right.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/(tabs)/index.tsx apps/mobile/components/
git commit -m "feat: add Home dashboard with leaderboard and activity feed"
```

---

### Task 11: Add Fine Modal

**Files:**

- Create: `apps/mobile/app/add-fine.tsx`
- Create: `apps/mobile/components/member-chip.tsx`

- [ ] **Step 1: Create MemberChip component**

Create `apps/mobile/components/member-chip.tsx`:

```tsx
import { Pressable, Text, View } from "react-native";

interface MemberChipProps {
  name: string;
  selected: boolean;
  onPress: () => void;
}

export function MemberChip({ name, selected, onPress }: MemberChipProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-xl px-4 py-2.5 ${
        selected ? "bg-indigo-600" : "bg-gray-900 border border-gray-700"
      }`}
    >
      <View
        className={`w-6 h-6 rounded-full items-center justify-center ${
          selected ? "bg-white/20" : "bg-indigo-900/50"
        }`}
      >
        <Text className={`text-xs font-semibold ${selected ? "text-white" : "text-indigo-300"}`}>
          {initial}
        </Text>
      </View>
      <Text className={`text-sm ${selected ? "text-white" : "text-gray-400"}`}>
        {name}
        {selected ? " ✓" : ""}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create Add Fine screen**

Create `apps/mobile/app/add-fine.tsx`:

```tsx
import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { getTeam, getMembers, getFineTypes, createFineEntry } from "../db/queries";
import { formatAmount } from "../lib/currency";
import { MemberChip } from "../components/member-chip";

export default function AddFineScreen() {
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [fineTypesList, setFineTypesList] = useState<
    { id: string; name: string; amount: number; description: string | null }[]
  >([]);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFineTypeId, setSelectedFineTypeId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const team = await getTeam();
    if (!team) return;
    setCurrency(team.currency);
    const [m, ft] = await Promise.all([getMembers(team.id), getFineTypes(team.id)]);
    setMembers(m);
    setFineTypesList(ft);
  }

  const selectedFineType = fineTypesList.find((f) => f.id === selectedFineTypeId);
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const canConfirm = selectedMemberId && selectedFineTypeId;

  async function handleConfirm() {
    if (!selectedMemberId || !selectedFineTypeId) return;
    const dateStr = date.toISOString().slice(0, 10);
    await createFineEntry(selectedFineTypeId, selectedMemberId, dateStr);

    // Show feedback, then reset for batch use
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setSelectedMemberId(null);
      setSelectedFineTypeId(null);
      setDate(new Date());
    }, 1200);
  }

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-white text-xl font-semibold mb-1">New Fine</Text>
      <Text className="text-gray-500 text-sm mb-6">Tap a player, then a fine</Text>

      {/* Step 1: Who? */}
      <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">1. Who?</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {members.map((m) => (
          <MemberChip
            key={m.id}
            name={m.name}
            selected={m.id === selectedMemberId}
            onPress={() => setSelectedMemberId(m.id === selectedMemberId ? null : m.id)}
          />
        ))}
        {members.length === 0 && (
          <Text className="text-gray-600 text-sm">No players added yet</Text>
        )}
      </View>

      {/* Step 2: What for? */}
      <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">2. What for?</Text>
      <View className="gap-2 mb-5">
        {fineTypesList.map((ft) => (
          <Pressable
            key={ft.id}
            onPress={() => setSelectedFineTypeId(ft.id === selectedFineTypeId ? null : ft.id)}
            className={`rounded-xl px-4 py-3.5 flex-row justify-between items-center ${
              ft.id === selectedFineTypeId
                ? "bg-gray-900 border-2 border-indigo-600"
                : "bg-gray-900 border border-gray-700"
            }`}
          >
            <Text
              className={`text-sm ${ft.id === selectedFineTypeId ? "text-white" : "text-gray-400"}`}
            >
              {ft.name}
            </Text>
            <Text
              className={`font-semibold text-sm ${
                ft.id === selectedFineTypeId ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              {formatAmount(ft.amount, currency)}
            </Text>
          </Pressable>
        ))}
        {fineTypesList.length === 0 && (
          <Text className="text-gray-600 text-sm">No fine types added yet</Text>
        )}
      </View>

      {/* Step 3: When? */}
      <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">3. When?</Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 flex-row justify-between items-center mb-6"
      >
        <Text className="text-white text-sm">{dateStr}</Text>
        <Text className="text-gray-500">📅</Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={(_, selectedDate) => {
            setShowDatePicker(Platform.OS === "ios");
            if (selectedDate) setDate(selectedDate);
          }}
          themeVariant="dark"
        />
      )}

      {/* Confirm */}
      <Pressable
        onPress={handleConfirm}
        disabled={!canConfirm || justAdded}
        className={`rounded-xl py-4 items-center ${
          justAdded ? "bg-green-600" : canConfirm ? "bg-indigo-600" : "bg-gray-800"
        }`}
      >
        <Text
          className={`text-base font-semibold ${
            canConfirm || justAdded ? "text-white" : "text-gray-600"
          }`}
        >
          {justAdded
            ? "✓ Added!"
            : canConfirm
              ? `Fine ${selectedMember?.name} — ${formatAmount(selectedFineType!.amount, currency)}`
              : "Select player and fine"}
        </Text>
      </Pressable>

      {/* Close button */}
      <Pressable onPress={() => router.back()} className="mt-4 py-3 items-center">
        <Text className="text-gray-500 text-sm">Done</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Install DateTimePicker**

```bash
cd apps/mobile && npx expo install @react-native-community/datetimepicker
```

- [ ] **Step 4: Verify**

Run the app. From Home, tap the + FAB. Verify member chips, fine type selection, and date picker all work. Confirm a fine, verify "Added!" feedback, then verify the form resets for batch entry. Tap "Done" to dismiss. Return to Home and verify the fine appears in recent activity and leaderboard.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/add-fine.tsx apps/mobile/components/member-chip.tsx
git commit -m "feat: add Add Fine modal with batch support"
```

---

### Task 12: Player Detail Screen

**Files:**

- Create: `apps/mobile/app/player/[id].tsx`

- [ ] **Step 1: Build Player Detail screen**

Create `apps/mobile/app/player/[id].tsx`:

```tsx
import { useState, useCallback } from "react";
import { View, Text, SectionList, Alert } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useFocusEffect } from "expo-router";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { getTeam, getMembers, getPlayerDetail, deleteFineEntry } from "../../db/queries";
import { formatAmount } from "../../lib/currency";
import { PlayerAvatar } from "../../components/player-avatar";

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [memberName, setMemberName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [totalAmount, setTotalAmount] = useState(0);
  const [breakdown, setBreakdown] = useState<
    { fineTypeId: string; fineTypeName: string; amount: number; count: number; subtotal: number }[]
  >([]);
  const [history, setHistory] = useState<
    { id: string; fineTypeName: string; date: string; amount: number }[]
  >([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  async function loadData() {
    if (!id) return;
    const team = await getTeam();
    if (!team) return;
    setCurrency(team.currency);

    const membersList = await getMembers(team.id);
    const member = membersList.find((m) => m.id === id);
    if (member) setMemberName(member.name);

    const detail = await getPlayerDetail(id);
    setBreakdown(detail.breakdown);
    setHistory(detail.history);
    setTotalAmount(detail.breakdown.reduce((sum, b) => sum + b.subtotal, 0));
  }

  async function handleDeleteEntry(entryId: string) {
    await deleteFineEntry(entryId);
    await loadData();
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <>
      <Stack.Screen options={{ title: memberName || "Player" }} />

      <View className="flex-1 bg-black">
        {/* Header */}
        <View className="items-center py-5">
          <PlayerAvatar name={memberName} size={56} />
          <Text className="text-white text-xl font-bold mt-2">{memberName}</Text>
          <Text className="text-red-400 text-sm mt-1">
            {formatAmount(totalAmount, currency)} total
          </Text>
        </View>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">Breakdown</Text>
            {breakdown.map((b) => (
              <View
                key={b.fineTypeId}
                className="flex-row justify-between items-center bg-gray-900/50 rounded-xl px-3 py-3 mb-1.5"
              >
                <View>
                  <Text className="text-white text-sm">{b.fineTypeName}</Text>
                  <Text className="text-gray-600 text-xs">
                    {b.count} time{b.count !== 1 ? "s" : ""} × {formatAmount(b.amount, currency)}
                  </Text>
                </View>
                <Text className="text-red-400 font-semibold text-sm">
                  {formatAmount(b.subtotal, currency)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* History */}
        <View className="px-4 flex-1">
          <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">History</Text>
          {history.map((entry) => (
            <View
              key={entry.id}
              className="flex-row justify-between items-center py-2.5 border-b border-gray-900"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <Text className="text-gray-300 text-sm">{entry.fineTypeName}</Text>
              </View>
              <Text className="text-gray-600 text-xs">{formatDate(entry.date)}</Text>
            </View>
          ))}
          {history.length === 0 && (
            <Text className="text-gray-600 text-sm text-center py-8">No fines recorded</Text>
          )}
        </View>
      </View>
    </>
  );
}
```

Note: The spec mentions swipe-to-delete on history items. This uses `react-native-gesture-handler` which comes with Expo. If gesture handler isn't preconfigured, a simpler approach is long-press-to-delete (like we use in Players/Fines). The implementer should check if gesture handler is available and use long-press as fallback. For simplicity in v1, long-press delete is acceptable — add this import at the top but remove the Swipeable import if not needed:

```tsx
// If swipe-to-delete is too complex for v1, use long-press:
// onLongPress={() => Alert.alert("Delete", "Remove this fine?", [
//   { text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => handleDeleteEntry(entry.id) }
// ])}
```

- [ ] **Step 2: Verify**

Navigate to a player from Home leaderboard or Players tab. Verify breakdown shows grouped fines. Verify history shows individual entries. Test deleting an entry.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/player/
git commit -m "feat: add Player Detail screen with breakdown and history"
```

---

### Task 13: Settings Screen

**Files:**

- Modify: `apps/mobile/app/(tabs)/settings.tsx`

- [ ] **Step 1: Build Settings screen**

Replace `apps/mobile/app/(tabs)/settings.tsx`:

```tsx
import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { getTeam, updateTeam } from "../../db/queries";
import { currencies, getCurrencyInfo } from "../../lib/currency";

export default function SettingsScreen() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const team = await getTeam();
    if (!team) return;
    setTeamId(team.id);
    setTeamName(team.name);
    setSelectedCurrency(team.currency);
  }

  async function handleSave() {
    if (!teamId || !teamName.trim()) return;
    await updateTeam(teamId, {
      name: teamName.trim(),
      currency: selectedCurrency,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const currencyInfo = getCurrencyInfo(selectedCurrency);

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 16 }}>
      {/* Team Name */}
      <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">Team Name</Text>
      <TextInput
        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 text-white text-base mb-5"
        value={teamName}
        onChangeText={setTeamName}
        placeholder="Team name"
        placeholderTextColor="#666"
      />

      {/* Currency */}
      <Text className="text-gray-500 text-xs uppercase tracking-wider mb-2">Currency</Text>
      <Pressable
        onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
        className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3.5 flex-row justify-between items-center mb-2"
      >
        <Text className="text-white text-base">{currencyInfo.name}</Text>
        <Text className="text-gray-400">
          {currencyInfo.code} {currencyInfo.symbol}
        </Text>
      </Pressable>

      {showCurrencyPicker && (
        <View className="bg-gray-900 border border-gray-700 rounded-xl mb-5 max-h-48 overflow-hidden">
          <ScrollView nestedScrollEnabled>
            {currencies.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => {
                  setSelectedCurrency(c.code);
                  setShowCurrencyPicker(false);
                }}
                className={`px-4 py-3 border-b border-gray-800 ${
                  c.code === selectedCurrency ? "bg-indigo-900/30" : ""
                }`}
              >
                <Text className="text-white text-base">
                  {c.symbol} — {c.name} ({c.code})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Save */}
      <Pressable
        onPress={handleSave}
        className={`rounded-xl py-4 items-center mt-4 ${saved ? "bg-green-600" : "bg-indigo-600"}`}
      >
        <Text className="text-white text-base font-semibold">
          {saved ? "✓ Saved" : "Save Changes"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Verify**

Navigate to Settings. Change team name and currency. Tap Save. Go back to Home and verify the changes are reflected.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(tabs)/settings.tsx
git commit -m "feat: add Settings screen with team name and currency editing"
```

---

### Task 14: Final Integration and Polish

**Files:**

- Modify: `apps/mobile/app/_layout.tsx` (if needed)
- Modify: `apps/mobile/app.json` (app name, scheme)
- Modify: `.gitignore` (add .superpowers/)

- [ ] **Step 1: Update app.json**

Set the app name and scheme in `apps/mobile/app.json`:

```json
{
  "expo": {
    "name": "Team Tally",
    "slug": "team-tally",
    "scheme": "team-tally",
    "version": "1.0.0",
    ...rest stays the same
  }
}
```

- [ ] **Step 2: Add .superpowers/ to .gitignore**

Append to root `.gitignore`:

```
.superpowers/
```

- [ ] **Step 3: Full flow test**

Test the complete flow end-to-end:

1. Delete the app / clear data to trigger onboarding
2. Enter team name, select currency → Continue
3. Add 3+ players in Players tab
4. Add 2+ fine types in Fines tab
5. Go to Home, tap +, add fines to different players
6. Verify leaderboard updates and ranks correctly
7. Verify recent activity shows new fines
8. Tap a player in leaderboard → Player Detail shows breakdown and history
9. Go to Settings, change team name and currency, verify it updates everywhere
10. Kill and relaunch app → should go straight to tabs (not onboarding)

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: Team Tally v1 complete — local fine tracking app"
```
