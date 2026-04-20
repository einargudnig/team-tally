import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("team-tally.db");

expoDb.execSync(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at INTEGER NOT NULL,
    double_day_date TEXT,
    last_monthly_run_at TEXT
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
    cadence TEXT NOT NULL DEFAULT 'one_off',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fine_entries (
    id TEXT PRIMARY KEY NOT NULL,
    fine_type_id TEXT NOT NULL REFERENCES fine_types(id),
    member_id TEXT NOT NULL REFERENCES members(id),
    date TEXT NOT NULL,
    multiplier INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS monthly_fine_members (
    fine_type_id TEXT NOT NULL REFERENCES fine_types(id),
    member_id TEXT NOT NULL REFERENCES members(id),
    PRIMARY KEY (fine_type_id, member_id)
  );
`);

function addColumnIfMissing(table: string, column: string, ddl: string) {
  const cols = expoDb.getAllSync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

addColumnIfMissing("teams", "double_day_date", "double_day_date TEXT");
addColumnIfMissing("teams", "last_monthly_run_at", "last_monthly_run_at TEXT");
addColumnIfMissing("fine_types", "cadence", "cadence TEXT NOT NULL DEFAULT 'one_off'");
addColumnIfMissing("fine_entries", "multiplier", "multiplier INTEGER NOT NULL DEFAULT 1");

export const db = drizzle(expoDb, { schema });
