# Domus — System Architecture

## 1. Architectural Overview

Domus uses a clean, single-codebase **Next.js 15 App Router** architecture backed by **Drizzle ORM + SQLite (`@libsql/client`)**. This eliminates multi-service operational overhead while keeping a strict boundary between UI components, domain engines (`src/lib/*`), and persistent storage (`src/db/*`).

```text
┌────────────────────────────────────────────────────────────────────┐
│                       Next.js App Router UI                        │
│  Home Pulse │ Common Calendar │ Trackers │ Lists & Chores │ Family │
└───────────────────────────────┬────────────────────────────────────┘
                                │ REST JSON API (/api/*)
┌───────────────────────────────▼────────────────────────────────────┐
│                      API Route Layer + Auth                        │
│   Session Verification (HMAC-SHA256 Cookie) -> RBAC Guard (can())  │
└───────┬───────────────────────┬──────────────────────────┬─────────┘
        │                       │                          │
┌───────▼────────┐   ┌──────────▼──────────┐   ┌───────────▼─────────┐
│  RBAC Engine   │   │   Overlap Engine    │   │   Zod Validation    │
│ src/lib/rbac   │   │  src/lib/schedule   │   │ src/lib/validation  │
└───────┬────────┘   └──────────┬──────────┘   └───────────┬─────────┘
        └───────────────────────┼──────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│                  Drizzle ORM + libSQL / SQLite                     │
│  households · members · events · time_bookings · trackers · logs   │
│  lists · list_items · audit_logs                                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (`src/db/schema.ts`)

| Table | Purpose | Key Columns |
|---|---|---|
| `households` | Top-level family container | `id`, `name`, `timezone`, `quietHoursStart`, `quietHoursEnd` |
| `members` | Family members + role & overrides | `id`, `householdId`, `name`, `email`, `passwordHash`, `role`, `color`, `avatarInitials`, `permissionsJson` |
| `calendar_events` | Individual & shared calendar blocks | `id`, `householdId`, `title`, `category`, `ownerId`, `participantIdsJson`, `startTime`, `endTime`, `visibility`, `isShared`, `notes` |
| `time_bookings` | Structured requests to book someone's time | `id`, `householdId`, `requesterId`, `targetMemberId`, `title`, `notes`, `startTime`, `endTime`, `status`, `approvedById`, `createdEventId` |
| `trackers` | Exercise, diet, and ongoing life plans | `id`, `householdId`, `memberId`, `type`, `title`, `unit`, `targetValue`, `currentValue`, `cadence`, `visibility` |
| `tracker_logs` | Daily check-ins (workouts, meals, hours) | `id`, `trackerId`, `memberId`, `date`, `value`, `note`, `metadataJson` |
| `household_lists` | Categorized lists (shopping, meal prep, chores) | `id`, `householdId`, `title`, `type`, `visibility`, `createdById` |
| `list_items` | Individual actionable items | `id`, `listId`, `title`, `category`, `quantity`, `assigneeId`, `dueDate`, `priority`, `isCompleted`, `completedById` |
| `audit_logs` | Accountability trail for Head of Household | `id`, `householdId`, `actorId`, `action`, `targetType`, `summary`, `createdAt` |

---

## 3. Overlap & Time-Booking Engine (`src/lib/schedule.ts`)

The Overlap Engine solves two core family problems:
1. **Schedule Overlap Detection**: Given all household events in a date window, identifies:
   - **Intentional Overlaps (`SHARED`)**: Events where multiple family members are participants (e.g., Family Yoga, Sunday Meal Prep).
   - **Time Collisions (`CONFLICT`)**: Overlapping events for the same person (or resource) so double-bookings stand out immediately.
2. **Free-Slot Finder (`findAvailableSlots`)**:
   - Scans a target member's schedule on a requested date (within active household waking hours, e.g., `07:00–21:00`).
   - Respects **Private** events as occupied intervals without leaking their titles.
   - Returns clean open windows + exact conflict reasons if a requested slot collides.

---

## 4. Security & Privacy Pipeline

1. Every protected API route calls `requireSession()` to authenticate the signed HTTP-only cookie (`domus_session`).
2. Before performing any mutation, routes call `can(member, permission, context)` from `src/lib/rbac.ts`.
3. Before returning calendar events or trackers, routes pass records through `redactEventForViewer()` / `canViewTracker()` so sensitive data is stripped **on the server**, never merely hidden in CSS.
