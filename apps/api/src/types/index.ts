/**
 * Re-export shared types for use in the API
 */
export * from "@team-tally/shared";

/**
 * API-specific types that extend or differ from shared types
 */

// Database record types (with timestamps as numbers for SQLite)
export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbTeam {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbTeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface DbFine {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  amount: number | null;
  fineDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbAllocation {
  id: string;
  fineId: string;
  memberId: string;
  quantity: number;
  allocatedAt: Date;
  allocatedBy: string;
}

export interface DbSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
