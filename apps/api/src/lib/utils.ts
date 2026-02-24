/**
 * Utility functions for the API
 */

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID() which is available in Bun
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Parse a date string into a Date object
 * Returns null if invalid
 */
export function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Create a standardized API error response
 */
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export function createError(
  error: string,
  code: string,
  details?: unknown
): ApiError {
  return { error, code, ...(details ? { details } : {}) };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  
  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  
  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  
  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",
} as const;
