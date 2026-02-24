# Team Tally API Implementation Plan

## Overview

Team tally web service where users can create teams, add members, create fines, and allocate fines to members on different dates. Built with Elysia.js, Bun, SQLite, and React.

## Core Domain Model

1. **Users** - Create teams and become auto-admin
2. **Teams** - Created by users, creator becomes admin
3. **Team Members** - Users belong to teams they created
4. **Fines** - Date-associated penalties per team with optional amounts
5. **Allocations** - Assign fines to multiple members (quantity: 1-3) on specific dates

## Database Schema

```sql
users: id, name, email, created_at, updated_at (existing)
teams: id, name, description, created_by, created_at, updated_at
team_members: id, team_id, user_id, role ('admin'|'member'), joined_at
fines: id, team_id, name, description, amount (optional), fine_date, created_at, updated_at
allocations: id, fine_id, member_id, quantity (1-3), allocated_at, allocated_by
```

### Key Relationships

- One-to-Many: Teams → Members, Teams → Fines, Fines → Allocations
- Many-to-Many (via join): Fines → Members (through allocations)
- Foreign Keys: Ensure data integrity across relationships

## Business Rules

1. **Auto-Admin**: Team creator automatically gets admin role
2. **Team Membership**: Users can only be on teams they created (for now)
3. **Fine Amount**: Optional field, added when created, can be updated later
4. **Multiple Allocations**: Same fine can be allocated to multiple members (separate allocation rows)
5. **Quantity Limits**: Allocation quantity restricted to 1-3 per member
6. **Date Tracking**: All fines have dates for filtering and reporting
7. **Member Retention**: When members leave, their allocated fines remain for historical tracking
8. **Role-Based Access**: Admins can manage members and fines

## API Endpoint Design

### Teams

```
GET/POST    /api/teams                    # Create/list user's teams
GET/PUT/DEL /api/teams/:id                # Manage specific team
```

### Team Members

```
GET/POST    /api/teams/:id/members        # Add/list team members
PUT/DEL     /api/teams/:id/members/:userId # Update member roles
```

### Fines

```
GET/POST    /api/teams/:id/fines          # Create/list fines for team
GET/PUT/DEL /api/fines/:id                # Manage specific fine
```

### Allocations

```
GET/POST    /api/fines/:id/allocations    # Allocate fine to members
GET/DELETE  /api/allocations/:id          # Manage allocations
```

### Filtering

```
GET         /api/fines?date=2024-01-15    # Single date filter
GET         /api/fines?start_date=...&end_date=... # Date range filter
```

## Implementation Phases

### Phase 1: Database Foundation (High Priority)

- [ ] Set up Drizzle ORM with SQLite database connection using bun:sqlite
- [ ] Create database schema with teams, members, fines (amount optional), allocations with 1-3 relationships and fine dates
- [ ] Update shared types to include Team, Member, Fine (amount optional), Allocation with proper TypeScript interfaces
- [ ] Add migration scripts for schema evolution

### Phase 2: Core Features (Medium Priority)

- [ ] Implement teams CRUD routes with auto-admin assignment for creator using Elysia route groups
- [ ] Create team members management routes with admin/member role support and team membership validation
- [ ] Implement fines management with optional amount, fine_date, and team association using TypeBox schemas
- [ ] Create allocation system allowing multiple members per fine (1-3 relationship) with individual tracking

### Phase 3: Advanced Features (Low Priority)

- [ ] Add dual date filtering: single date and date range for fines and allocations with query parameters
- [ ] Integrate better-auth middleware with team-based authorization for admin/member access control
- [ ] Update React frontend with team/fine management UI, date filters, and allocation interface

## Technical Implementation Details

### Elysia.js Features to Leverage

- **Route Groups**: Organize related endpoints under `/api/teams/:id/`
- **TypeBox Schemas**: Ensure type safety for fine amounts (optional) and allocation quantities (1-3)
- **Middleware**: Authentication and date filtering
- **Error Handling**: Custom responses for validation failures
- **Swagger Integration**: Auto-generated API documentation (already configured)

### Database Connection

- **Runtime**: Bun with `bun:sqlite`
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management

### Authentication & Authorization

- **Library**: better-auth (already in dependencies)
- **JWT**: @elysiajs/jwt for token management
- **Middleware**: Role-based access control per team
- **Validation**: Team ownership and admin role verification

### Date Filtering Implementation

- **Single Date**: `?date=2024-01-15` filters fines for specific date
- **Date Range**: `?start_date=2024-01-01&end_date=2024-01-31` filters within date range
- **Validation**: Ensure proper date format and logical range validation

## File Structure

```
apps/api/src/
├── db/
│   ├── schema.ts          # Drizzle schema definitions
│   ├── index.ts           # Database connection
│   └── migrations/        # Database migration files
├── routes/
│   ├── index.ts           # Route aggregation
│   ├── users.ts           # Existing user routes
│   ├── teams.ts           # Team CRUD operations
│   ├── members.ts         # Team member management
│   ├── fines.ts           # Fine management
│   └── allocations.ts     # Fine allocations
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   └── validation.ts      # Custom validation middleware
├── lib/
│   ├── auth.ts            # Authentication utilities
│   └── db.ts              # Database utilities
└── types/
    └── index.ts           # Type definitions
```

## Dependencies to Add

```json
{
  "dependencies": {
    "drizzle-orm": "^0.41.0",
    "drizzle-kit": "^0.30.6"
  }
}
```

## Shared Types Update

Extend `packages/shared/index.ts` with:

```typescript
export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface Fine {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  amount?: number;
  fineDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Allocation {
  id: string;
  fineId: string;
  memberId: string;
  quantity: number; // 1-3
  allocatedAt: Date;
  allocatedBy: string;
}
```

## Next Steps

1. Begin Phase 1 by setting up Drizzle ORM and database schema
2. Create migration scripts for database setup
3. Implement teams CRUD with auto-admin assignment
4. Build out fines and allocations functionality
5. Add authentication and authorization middleware
6. Implement date filtering capabilities
7. Update React frontend with new features

## Notes

- All database operations should be type-safe using Drizzle ORM
- Use existing Elysia.js patterns for route organization and error handling
- Maintain consistency with current codebase structure and naming conventions
- Leverage Bun's built-in features for optimal performance
