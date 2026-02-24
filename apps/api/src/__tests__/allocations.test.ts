import { describe, test, expect } from "bun:test";
import { z } from "zod";

describe("Allocation Validation Schemas", () => {
  const createAllocationSchema = z.object({
    memberId: z.string().uuid(),
    quantity: z.number().int().min(1).max(3),
  });

  const bulkAllocateSchema = z.object({
    allocations: z.array(
      z.object({
        memberId: z.string().uuid(),
        quantity: z.number().int().min(1).max(3),
      })
    ).min(1),
  });

  const updateAllocationSchema = z.object({
    quantity: z.number().int().min(1).max(3),
  });

  test("create schema validates correct input", () => {
    const result = createAllocationSchema.safeParse({
      memberId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  test("create schema rejects quantity below 1", () => {
    const result = createAllocationSchema.safeParse({
      memberId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects quantity above 3", () => {
    const result = createAllocationSchema.safeParse({
      memberId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 4,
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects non-integer quantity", () => {
    const result = createAllocationSchema.safeParse({
      memberId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  test("create schema rejects invalid member ID", () => {
    const result = createAllocationSchema.safeParse({
      memberId: "not-a-uuid",
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  test("bulk schema validates correct input", () => {
    const result = bulkAllocateSchema.safeParse({
      allocations: [
        { memberId: "123e4567-e89b-12d3-a456-426614174000", quantity: 1 },
        { memberId: "223e4567-e89b-12d3-a456-426614174000", quantity: 2 },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("bulk schema rejects empty allocations array", () => {
    const result = bulkAllocateSchema.safeParse({
      allocations: [],
    });
    expect(result.success).toBe(false);
  });

  test("update schema validates correct input", () => {
    const result = updateAllocationSchema.safeParse({
      quantity: 3,
    });
    expect(result.success).toBe(true);
  });
});

describe("Allocation Business Logic", () => {
  test("cannot allocate same fine to same member twice", () => {
    // Simulating the check for existing allocation
    const existingAllocations = [
      { fineId: "fine-1", memberId: "member-1" },
      { fineId: "fine-1", memberId: "member-2" },
    ];

    const newAllocation = { fineId: "fine-1", memberId: "member-1" };

    const isDuplicate = existingAllocations.some(
      (a) => a.fineId === newAllocation.fineId && a.memberId === newAllocation.memberId
    );

    expect(isDuplicate).toBe(true);
  });

  test("can allocate same fine to different member", () => {
    const existingAllocations = [
      { fineId: "fine-1", memberId: "member-1" },
    ];

    const newAllocation = { fineId: "fine-1", memberId: "member-2" };

    const isDuplicate = existingAllocations.some(
      (a) => a.fineId === newAllocation.fineId && a.memberId === newAllocation.memberId
    );

    expect(isDuplicate).toBe(false);
  });

  test("can allocate different fine to same member", () => {
    const existingAllocations = [
      { fineId: "fine-1", memberId: "member-1" },
    ];

    const newAllocation = { fineId: "fine-2", memberId: "member-1" };

    const isDuplicate = existingAllocations.some(
      (a) => a.fineId === newAllocation.fineId && a.memberId === newAllocation.memberId
    );

    expect(isDuplicate).toBe(false);
  });
});

describe("Allocation Summary Calculations", () => {
  test("calculate total fines for a member", () => {
    const memberAllocations = [
      { fineAmount: 10, quantity: 2 },
      { fineAmount: 5, quantity: 1 },
      { fineAmount: 15, quantity: 3 },
    ];

    const total = memberAllocations.reduce(
      (sum, a) => sum + (a.fineAmount * a.quantity),
      0
    );

    expect(total).toBe(10 * 2 + 5 * 1 + 15 * 3); // 20 + 5 + 45 = 70
    expect(total).toBe(70);
  });

  test("calculate allocation count for a fine", () => {
    const fineAllocations = [
      { memberId: "member-1", quantity: 2 },
      { memberId: "member-2", quantity: 1 },
      { memberId: "member-3", quantity: 3 },
    ];

    const memberCount = fineAllocations.length;
    const totalQuantity = fineAllocations.reduce((sum, a) => sum + a.quantity, 0);

    expect(memberCount).toBe(3);
    expect(totalQuantity).toBe(6);
  });

  test("group allocations by member", () => {
    const allocations = [
      { memberId: "member-1", fineId: "fine-1", quantity: 2 },
      { memberId: "member-1", fineId: "fine-2", quantity: 1 },
      { memberId: "member-2", fineId: "fine-1", quantity: 3 },
    ];

    const byMember = allocations.reduce((acc, a) => {
      if (!acc[a.memberId]) {
        acc[a.memberId] = [];
      }
      acc[a.memberId].push(a);
      return acc;
    }, {} as Record<string, typeof allocations>);

    expect(Object.keys(byMember).length).toBe(2);
    expect(byMember["member-1"].length).toBe(2);
    expect(byMember["member-2"].length).toBe(1);
  });
});
