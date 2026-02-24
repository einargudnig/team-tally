import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { env } from "../lib/env.js";
import * as schema from "./schema.js";

// Ensure data directory exists
import { mkdirSync } from "fs";
import { dirname } from "path";

try {
  mkdirSync(dirname(env.DATABASE_URL), { recursive: true });
} catch {
  // Directory may already exist
}

// Create SQLite database connection
const sqlite = new Database(env.DATABASE_URL);

// Enable WAL mode for better concurrent performance
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for use in routes
export { schema };

// Export type for database instance
export type DB = typeof db;
