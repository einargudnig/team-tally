import { Hono } from "hono";
import { cors } from "hono/cors";
import { apiReference } from "@scalar/hono-api-reference";
import { env } from "./lib/env.js";
import { db, schema } from "./db/index.js";
import { logger } from "./middleware/logger.js";
import { generalRateLimit } from "./middleware/rate-limit.js";
import { createError, ErrorCodes } from "./lib/utils.js";

// Import routes
import { auth } from "./routes/auth.js";
import { users } from "./routes/users.js";
import { teams } from "./routes/teams.js";
import { members } from "./routes/members.js";
import { fines } from "./routes/fines.js";
import { allocations } from "./routes/allocations.js";

const app = new Hono();

// ============ Global Middleware ============

// CORS middleware - configure for your frontend origins in production
app.use("/*", cors({
  origin: env.NODE_ENV === "production" 
    ? ["https://your-frontend-domain.com"] // TODO: Configure production origins
    : "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  maxAge: 86400, // 24 hours
  credentials: true,
}));

// Request logging (skip health checks to reduce noise)
app.use("/*", async (c, next) => {
  if (c.req.path === "/health") {
    return next();
  }
  return logger(c, next);
});

// Global rate limiting
app.use("/api/*", generalRateLimit);

// ============ Error Handling ============

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  
  // Don't leak error details in production
  const message = env.NODE_ENV === "production" 
    ? "An unexpected error occurred"
    : err.message;
  
  return c.json(
    createError(message, ErrorCodes.INTERNAL_ERROR),
    500
  );
});

// Handle 404s
app.notFound((c) => {
  return c.json(
    createError("Not found", ErrorCodes.NOT_FOUND),
    404
  );
});

// ============ Health Check ============

app.get("/health", async (c) => {
  // Basic health check
  const health: Record<string, any> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };

  // Check database connectivity
  try {
    // Simple query to verify DB is accessible
    await db.query.users.findFirst();
    health.database = "connected";
  } catch (error) {
    health.status = "degraded";
    health.database = "disconnected";
    console.error("Health check - DB error:", error);
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return c.json(health, statusCode);
});

// ============ API Routes ============

// Auth routes (register, login, logout, me)
app.route("/api/auth", auth);

// User routes
app.route("/api/users", users);

// Team routes
app.route("/api/teams", teams);

// Team member routes (nested under teams)
app.route("/api/teams", members);

// Fine routes (mixed paths: /api/teams/:teamId/fines and /api/fines/:fineId)
app.route("/api", fines);

// Allocation routes (mixed paths: /api/fines/:fineId/allocations and /api/allocations/:id)
app.route("/api", allocations);

// ============ API Documentation ============

// OpenAPI spec - enhanced with actual endpoint info
app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "Team Tally API",
      version: "1.0.0",
      description: "API for managing team fines and allocations",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
    ],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          tags: ["System"],
          responses: {
            200: { description: "Service is healthy" },
            503: { description: "Service is degraded" },
          },
        },
      },
      "/api/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", minLength: 2 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            409: { description: "Email already registered" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Login user",
          tags: ["Authentication"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          summary: "Logout user",
          tags: ["Authentication"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Logged out successfully" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          summary: "Get current user",
          tags: ["Authentication"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Current user info" },
            401: { description: "Not authenticated" },
          },
        },
      },
      "/api/teams": {
        get: {
          summary: "List user's teams",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "List of teams" },
          },
        },
        post: {
          summary: "Create a new team",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    description: { type: "string", maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Team created" },
          },
        },
      },
      "/api/teams/{teamId}": {
        get: {
          summary: "Get team details",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: { description: "Team details" },
            404: { description: "Team not found" },
          },
        },
        put: {
          summary: "Update team (admin only)",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: { description: "Team updated" },
            403: { description: "Admin access required" },
          },
        },
        delete: {
          summary: "Delete team (admin only)",
          tags: ["Teams"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: { description: "Team deleted" },
            403: { description: "Admin access required" },
          },
        },
      },
      "/api/teams/{teamId}/members": {
        get: {
          summary: "List team members",
          tags: ["Members"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: { description: "List of members" },
          },
        },
        post: {
          summary: "Add member to team (admin only)",
          tags: ["Members"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                    role: { type: "string", enum: ["admin", "member"], default: "member" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Member added" },
            404: { description: "User not found" },
            409: { description: "Already a member" },
          },
        },
      },
      "/api/teams/{teamId}/fines": {
        get: {
          summary: "List fines for team",
          tags: ["Fines"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
            { name: "date", in: "query", schema: { type: "string", format: "date" } },
            { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
            { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          ],
          responses: {
            200: { description: "List of fines" },
          },
        },
        post: {
          summary: "Create a fine (admin only)",
          tags: ["Fines"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "teamId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "fineDate"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100 },
                    description: { type: "string", maxLength: 500 },
                    amount: { type: "number" },
                    fineDate: { type: "string", format: "date" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Fine created" },
          },
        },
      },
      "/api/fines/{fineId}/allocations": {
        get: {
          summary: "List allocations for fine",
          tags: ["Allocations"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "fineId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: {
            200: { description: "List of allocations" },
          },
        },
        post: {
          summary: "Allocate fine to member (admin only)",
          tags: ["Allocations"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "fineId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["memberId", "quantity"],
                  properties: {
                    memberId: { type: "string", format: "uuid" },
                    quantity: { type: "integer", minimum: 1, maximum: 3 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Allocation created" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
  });
});

// API documentation UI
app.get(
  "/docs",
  apiReference({
    spec: {
      url: "/openapi.json",
    },
    theme: "purple",
  })
);

// ============ Database Initialization ============

async function initializeDatabase() {
  console.log("🔄 Initializing database...");
  
  try {
    // Create tables if they don't exist
    // Using raw SQL for initial setup since Drizzle migrations require separate setup
    const { Database } = await import("bun:sqlite");
    const sqlite = new Database(env.DATABASE_URL);
    
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
        joined_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS fines (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        amount REAL,
        fine_date INTEGER NOT NULL,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS allocations (
        id TEXT PRIMARY KEY,
        fine_id TEXT NOT NULL REFERENCES fines(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 1 AND quantity <= 3),
        allocated_at INTEGER NOT NULL,
        allocated_by TEXT NOT NULL REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      
      -- Indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_fines_team_id ON fines(team_id);
      CREATE INDEX IF NOT EXISTS idx_fines_fine_date ON fines(fine_date);
      CREATE INDEX IF NOT EXISTS idx_allocations_fine_id ON allocations(fine_id);
      CREATE INDEX IF NOT EXISTS idx_allocations_member_id ON allocations(member_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `);
    
    sqlite.close();
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// ============ Start Server ============

// Initialize database before starting server
await initializeDatabase();

export type App = typeof app;

export default {
  port: parseInt(env.PORT),
  fetch: app.fetch,
};

console.log(`🔥 Team Tally API running at http://localhost:${env.PORT}`);
console.log(`📚 API docs at http://localhost:${env.PORT}/docs`);
console.log(`🏥 Health check at http://localhost:${env.PORT}/health`);
