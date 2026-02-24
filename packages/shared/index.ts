/**
 * Shared types and utilities for Team Tally
 */

// ============ User Types ============

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
}

// ============ Team Types ============

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamWithRole extends Team {
  role: "admin" | "member";
  joinedAt: Date;
}

export interface TeamResponse {
  team: Team;
}

export interface TeamsResponse {
  teams: TeamWithRole[];
}

// ============ Team Member Types ============

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
  user?: User;
}

export interface MemberResponse {
  member: TeamMember;
}

export interface MembersResponse {
  members: TeamMember[];
}

// ============ Fine Types ============

export interface Fine {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  amount?: number;
  fineDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FineWithAllocations extends Fine {
  allocations: Allocation[];
  creator?: Pick<User, "id" | "name">;
}

export interface FineResponse {
  fine: Fine;
}

export interface FinesResponse {
  fines: FineWithAllocations[];
}

// ============ Allocation Types ============

export interface Allocation {
  id: string;
  fineId: string;
  memberId: string;
  quantity: number; // 1-3
  allocatedAt: Date;
  allocatedBy: string;
  member?: TeamMember;
  allocator?: Pick<User, "id" | "name">;
}

export interface AllocationResponse {
  allocation: Allocation;
}

export interface AllocationsResponse {
  allocations: Allocation[];
}

// ============ Auth Types ============

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ============ API Error Types ============

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============ Shared Utilities ============

/**
 * Format a date to ISO string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Format a date to YYYY-MM-DD
 */
export const formatDateShort = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Parse a date string safely
 */
export const parseDate = (dateStr: string): Date | null => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Calculate total fine amount for allocations
 */
export const calculateTotalFines = (
  allocations: Array<{ quantity: number; fine?: { amount?: number } }>
): number => {
  return allocations.reduce((total, allocation) => {
    const amount = allocation.fine?.amount || 0;
    return total + amount * allocation.quantity;
  }, 0);
};
