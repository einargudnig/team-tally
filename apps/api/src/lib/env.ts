import { z } from "zod";

/**
 * Environment configuration with strict validation.
 * The API will fail to start if required secrets are missing in production.
 */
const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("./data/team-tally.db"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
});

// In development, use fallback secrets (but warn)
const devDefaults = {
  JWT_SECRET: "dev-secret-minimum-32-characters-long-for-security",
  BETTER_AUTH_SECRET: "dev-auth-secret-minimum-32-chars-for-security",
};

function loadEnv() {
  const isDev = process.env.NODE_ENV !== "production";
  
  const rawEnv = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || (isDev ? devDefaults.JWT_SECRET : undefined),
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || (isDev ? devDefaults.BETTER_AUTH_SECRET : undefined),
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(result.error.format());
    
    if (!isDev) {
      // In production, fail hard
      throw new Error("Missing required environment variables. Check logs above.");
    }
    
    console.warn("⚠️  Using development defaults. DO NOT use in production!");
  }

  if (isDev && (!process.env.JWT_SECRET || !process.env.BETTER_AUTH_SECRET)) {
    console.warn("⚠️  Using default secrets in development mode. Set JWT_SECRET and BETTER_AUTH_SECRET for production.");
  }

  return result.success ? result.data : envSchema.parse({
    ...rawEnv,
    JWT_SECRET: devDefaults.JWT_SECRET,
    BETTER_AUTH_SECRET: devDefaults.BETTER_AUTH_SECRET,
  });
}

export const env = loadEnv();
