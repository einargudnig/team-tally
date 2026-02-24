import { Context, Next } from "hono";

/**
 * Request logging middleware
 * 
 * Logs:
 * - Request method and path
 * - Response status code
 * - Response time
 * - Client IP
 * - User ID (if authenticated)
 */

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  ip: string;
  userId?: string;
  userAgent?: string;
  error?: string;
}

/**
 * Format log entry for console output
 */
function formatLog(entry: LogEntry): string {
  const statusColor = entry.status >= 500 ? "\x1b[31m" // red
    : entry.status >= 400 ? "\x1b[33m" // yellow
    : entry.status >= 300 ? "\x1b[36m" // cyan
    : "\x1b[32m"; // green
  
  const reset = "\x1b[0m";
  
  const parts = [
    `${entry.method.padEnd(7)}`,
    `${statusColor}${entry.status}${reset}`,
    `${entry.path}`,
    `${entry.duration}ms`,
  ];

  if (entry.userId) {
    parts.push(`user:${entry.userId.slice(0, 8)}...`);
  }

  if (entry.error) {
    parts.push(`error:${entry.error}`);
  }

  return parts.join(" | ");
}

/**
 * Get client IP address from request
 */
function getClientIp(c: Context): string {
  const forwarded = c.req.header("X-Forwarded-For");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return c.req.header("X-Real-IP") || "unknown";
}

/**
 * Logger middleware
 */
export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = getClientIp(c);
  const userAgent = c.req.header("User-Agent");

  let error: string | undefined;

  try {
    await next();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    const duration = Date.now() - start;
    const status = c.res.status;
    const userId = c.get("userId");

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      method,
      path,
      status,
      duration,
      ip,
      userId,
      userAgent,
      error,
    };

    // Log to console
    console.log(formatLog(entry));

    // In production, you might want to:
    // - Send to a logging service (Datadog, Logtail, etc.)
    // - Write to a file
    // - Store in database for analytics
  }
}

/**
 * Skip logging for certain paths (e.g., health checks)
 */
export function loggerWithSkip(skipPaths: string[]) {
  return async (c: Context, next: Next) => {
    if (skipPaths.includes(c.req.path)) {
      return next();
    }
    return logger(c, next);
  };
}
