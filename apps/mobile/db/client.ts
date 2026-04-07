import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("team-tally.db");

// Create tables if they don't exist
expoDb.execSync(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY NOT NULL,
    team_id TEXT NOT NULL REFERENCES teams(id),
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fine_types (
    id TEXT PRIMARY KEY NOT NULL,
    team_id TEXT NOT NULL REFERENCES teams(id),
    name TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fine_entries (
    id TEXT PRIMARY KEY NOT NULL,
    fine_type_id TEXT NOT NULL REFERENCES fine_types(id),
    member_id TEXT NOT NULL REFERENCES members(id),
    date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export const db = drizzle(expoDb, { schema });
