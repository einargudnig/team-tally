import { describe, test, expect } from "bun:test";
import { generateId, parseDate, formatDate, createError, ErrorCodes } from "../lib/utils.js";

describe("generateId", () => {
  test("generates valid UUID", () => {
    const id = generateId();
    
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });

  test("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });
});

describe("parseDate", () => {
  test("parses valid ISO date string", () => {
    const date = parseDate("2024-01-15");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2024);
    expect(date?.getMonth()).toBe(0); // January is 0
    expect(date?.getDate()).toBe(15);
  });

  test("parses valid ISO datetime string", () => {
    const date = parseDate("2024-01-15T10:30:00.000Z");
    expect(date).not.toBeNull();
  });

  test("returns null for invalid date", () => {
    const date = parseDate("not-a-date");
    expect(date).toBeNull();
  });

  test("returns null for empty string", () => {
    const date = parseDate("");
    expect(date).toBeNull();
  });
});

describe("formatDate", () => {
  test("formats date to ISO date string", () => {
    const date = new Date("2024-01-15T10:30:00.000Z");
    const formatted = formatDate(date);
    expect(formatted).toBe("2024-01-15");
  });
});

describe("createError", () => {
  test("creates error with message and code", () => {
    const error = createError("Something went wrong", ErrorCodes.INTERNAL_ERROR);
    expect(error.error).toBe("Something went wrong");
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.details).toBeUndefined();
  });

  test("creates error with details", () => {
    const error = createError("Validation failed", ErrorCodes.VALIDATION_ERROR, {
      fields: ["name", "email"],
    });
    expect(error.error).toBe("Validation failed");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ fields: ["name", "email"] });
  });
});

describe("ErrorCodes", () => {
  test("contains expected codes", () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCodes.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCodes.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCodes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCodes.RATE_LIMITED).toBe("RATE_LIMITED");
  });
});
