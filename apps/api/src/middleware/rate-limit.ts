import { Context, Next } from "hono";
import { createError, ErrorCodes } from "../lib/utils.js";

/**
 * Simple in-memory rate limiter
 * 
 * NOTE: This is suitable for single-server deployments.
 * For multi-server deployments, use Redis or similar distributed store.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store for rate limit entries: IP -> entry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Custom key generator (defaults to IP address) */
  keyGenerator?: (c: Context) => string;
  /** Skip rate limiting for certain requests */
  skip?: (c: Context) => boolean;
}

/**
 * Create a rate limiting middleware
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    limit,
    windowMs,
    keyGenerator = (c) => getClientIp(c),
    skip,
  } = options;

  return async (c: Context, next: Next) => {
    // Check if we should skip rate limiting
    if (skip && skip(c)) {
      return next();
    }

    const key = keyGenerator(c);
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment existing entry
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, limit - entry.count);
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetInSeconds));

    // Check if rate limited
    if (entry.count > limit) {
      c.header("Retry-After", String(resetInSeconds));
      return c.json(
        createError(
          `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
          ErrorCodes.RATE_LIMITED
        ),
        429
      );
    }

    await next();
  };
}

/**
 * Get client IP address from request
 * Handles common proxy headers
 */
function getClientIp(c: Context): string {
  // Check common proxy headers
  const forwarded = c.req.header("X-Forwarded-For");
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIp = c.req.header("X-Real-IP");
  if (realIp) {
    return realIp;
  }

  // Fall back to connection remote address (may not be available in all environments)
  // In Bun.serve, we might need to access this differently
  return "unknown";
}

/**
 * Preset rate limiters for common use cases
 */

// General API rate limit: 100 requests per minute
export const generalRateLimit = rateLimit({
  limit: 100,
  windowMs: 60 * 1000,
});

// Auth endpoints: 10 requests per minute (prevent brute force)
export const authRateLimit = rateLimit({
  limit: 10,
  windowMs: 60 * 1000,
});

// Strict rate limit: 5 requests per minute (for sensitive operations)
export const strictRateLimit = rateLimit({
  limit: 5,
  windowMs: 60 * 1000,
});
