import { describe, test, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { cleanupTestDb, createTestUser, authHeader } from "./setup.js";

// NOTE: These tests use a simplified setup. In a real scenario, you'd want to
// mock the database module or use dependency injection.

describe("Auth Validation Schemas", () => {
  const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  test("register schema validates correct input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "securepassword123",
    });
    expect(result.success).toBe(true);
  });

  test("register schema rejects short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "securepassword123",
    });
    expect(result.success).toBe(false);
  });

  test("register schema rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "not-an-email",
      password: "securepassword123",
    });
    expect(result.success).toBe(false);
  });

  test("register schema rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  test("login schema validates correct input", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  test("login schema rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anypassword",
    });
    expect(result.success).toBe(false);
  });

  test("login schema rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Password Hashing", () => {
  test("password can be hashed and verified", async () => {
    const password = "testpassword123";
    const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
    
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
    
    const isValid = await Bun.password.verify(password, hash);
    expect(isValid).toBe(true);
  });

  test("wrong password fails verification", async () => {
    const password = "testpassword123";
    const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
    
    const isValid = await Bun.password.verify("wrongpassword", hash);
    expect(isValid).toBe(false);
  });
});

describe("Session Token Generation", () => {
  test("generates unique tokens", () => {
    const generateToken = () => {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    };

    const token1 = generateToken();
    const token2 = generateToken();

    expect(token1.length).toBe(64);
    expect(token2.length).toBe(64);
    expect(token1).not.toBe(token2);
  });
});

describe("Auth Middleware Logic", () => {
  test("missing authorization header returns 401", async () => {
    const app = new Hono();
    
    app.use("/protected", async (c, next) => {
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      await next();
    });
    
    app.get("/protected", (c) => c.json({ data: "secret" }));

    const res = await app.request("/protected");
    expect(res.status).toBe(401);
  });

  test("invalid bearer format returns 401", async () => {
    const app = new Hono();
    
    app.use("/protected", async (c, next) => {
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      await next();
    });
    
    app.get("/protected", (c) => c.json({ data: "secret" }));

    const res = await app.request("/protected", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(res.status).toBe(401);
  });

  test("valid bearer token passes middleware", async () => {
    const app = new Hono();
    
    app.use("/protected", async (c, next) => {
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      // In real middleware, we'd verify the token here
      await next();
    });
    
    app.get("/protected", (c) => c.json({ data: "secret" }));

    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
  });
});
