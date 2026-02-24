import { describe, test, expect } from "bun:test";
import { z } from "zod";

// Helper to parse dates
const parseDate = (dateStr: string): Date | null => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

describe("Fine Validation Schemas", () => {
  const createFineSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    amount: z.number().positive().optional(),
    fineDate: z.string().refine((val) => parseDate(val) !== null, {
      message: "Invalid date format",
    }),
  });

  const updateFineSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    amount: z.number().positive().nullable().optional(),
    fineDate: z.string().refine((val) => parseDate(val) !== null, {
      message: "Invalid date format",
    }).optional(),
  });

  test("create schema validates correct input", () => {
    const result = createFineSchema.safeParse({
      name: "Late to practice",
      description: "Arrived more than 15 minutes late",
      amount: 10.50,
      fineDate: "2024-01-15",
    });
    expect(result.success).toBe(true);
  });

  test("create schema accepts missing optional fields", () => {
    const result = createFineSchema.safeParse({
      name: "Late to practice",
      fineDate: "2024-01-15",
    });
    expect(result.success).toBe(true);
  });

  test("create schema rejects invalid date", () => {
    const result = createFineSchema.safeParse({
      name: "Late to practice",
      fineDate: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects negative amount", () => {
    const result = createFineSchema.safeParse({
      name: "Late to practice",
      amount: -5,
      fineDate: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects zero amount", () => {
    const result = createFineSchema.safeParse({
      name: "Late to practice",
      amount: 0,
      fineDate: "2024-01-15",
    });
    expect(result.success).toBe(false);
  });

  test("update schema accepts partial updates", () => {
    const result = updateFineSchema.safeParse({
      amount: 15.00,
    });
    expect(result.success).toBe(true);
  });

  test("update schema accepts null amount (to clear it)", () => {
    const result = updateFineSchema.safeParse({
      amount: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("Date Filtering", () => {
  const dateFilterSchema = z.object({
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });

  test("accepts single date filter", () => {
    const result = dateFilterSchema.safeParse({
      date: "2024-01-15",
    });
    expect(result.success).toBe(true);
  });

  test("accepts date range filter", () => {
    const result = dateFilterSchema.safeParse({
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });
    expect(result.success).toBe(true);
  });

  test("accepts no filters", () => {
    const result = dateFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  test("date range logic works correctly", () => {
    const fineDate = new Date("2024-01-15");
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    expect(fineDate >= startDate && fineDate <= endDate).toBe(true);
  });

  test("date outside range is excluded", () => {
    const fineDate = new Date("2024-02-15");
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-31");

    expect(fineDate >= startDate && fineDate <= endDate).toBe(false);
  });
});

describe("Fine Amount Calculations", () => {
  test("total fine amount calculation", () => {
    const fines = [
      { amount: 10 },
      { amount: 15.50 },
      { amount: null }, // Optional amount
      { amount: 5 },
    ];

    const total = fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    expect(total).toBe(30.50);
  });

  test("fine with quantity calculation", () => {
    const fine = { amount: 10 };
    const allocation = { quantity: 3 };

    const totalForMember = (fine.amount || 0) * allocation.quantity;
    expect(totalForMember).toBe(30);
  });
});
