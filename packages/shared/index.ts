console.log("Hello via Bun!");

// Shared types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Shared utilities
export const formatDate = (date: Date) => {
  return date.toISOString();
};
