# Domus

**A lightweight, architectural operating hub for real households.**

Domus brings your entire family's overlapping and individual lives into one fast, purpose-built workspace: a shared calendar with **time-booking**, **exercise, diet & lifestyle trackers** (yoga, driving lessons, workouts, nutrition), **shared household lists** (shopping, meal prep, lawn mowing, chores), and **real family roles & permissions** anchored by a Head of Household.

> Lighter than Notion (zero setup overhead, opinionated home primitives). Richer than Google Calendar (built for household overlap, time-booking, health routines, and shared execution).

---

## Why Domus?

| Problem with generic tools | How Domus solves it |
|---|---|
| **Notion** is too heavy and slow for quick daily family use | Instant, purpose-built views: Home Pulse, Common Calendar, Trackers, and Household Lists — zero manual database building |
| **Google Calendar** only tracks events — no chores, diet, or booking friction | Combines **overlapping & individual schedules** with a **Time-Booking Engine**, **Exercise/Diet/Life Trackers**, and **Actionable Lists** |
| **No real household governance** | First-class RBAC with **Head of Household**, **Co-Head**, **Member**, **Junior**, and **Guest** roles, privacy redaction, and booking approvals |

---

## Core Features (MVP)

- **Home Pulse (Dashboard)**: Instant household snapshot — who's free vs. busy right now, today's overlapping family blocks, pending time-booking requests, health/plan progress, and priority chores/shopping items.
- **Common Calendar & Time-Booking ("Overlap Engine")**:
  - Side-by-side and overlaid household schedule distinguishing **Shared / Overlapping** events (e.g., Family Dinner, Costco Run) from **Individual** plans (e.g., Driving Lesson, Morning Yoga) and **Private** blocks (rendered as `"Busy"` to other members).
  - **Book Someone's Time**: Select a family member, view real-time conflict detection and open 30/60-min slots, and send a structured booking request (`Pending → Accepted / Declined`).
- **Health, Diet & Life Plan Trackers**:
  - Track **Exercise** (Yoga, Running, Strength, Cycling), **Diet & Nutrition** (meals, hydration, dietary plans), and **Ongoing Life Plans** (Driving Lessons hours, 30-Day Yoga streak, Weekly Grocery Budget).
  - Household-wide visibility with optional personal privacy.
- **Shared Household Lists & Chores**:
  - Dedicated lists for **Shopping**, **Meal Prep**, and **Home & Yard Chores** (lawn mowing, dishes, laundry, maintenance).
  - Assign owners, set priority/due dates, check off in real time, and filter by **Mine**, **Shared**, or **Everyone**.
- **Family Roles & Permissions (RBAC)**:
  - `HEAD` (Head of Household), `CO_HEAD`, `MEMBER`, `JUNIOR`, and `GUEST` roles enforced across every API route.
  - Per-member permission overrides, private-block redaction, approval workflows, and a household audit log.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Lucide icons (PWA-ready for mobile & desktop)
- **Database**: SQLite via Drizzle ORM + `@libsql/client` (zero external DB setup locally; seamlessly upgrades to Turso / PostgreSQL)
- **Auth & RBAC**: Signed HTTP-only session cookies (`scrypt` + HMAC-SHA256) with server-enforced RBAC middleware
- **Testing**: Vitest unit tests for RBAC permissions & the schedule overlap/time-booking engine

---

## Quick Start

### Prerequisites
- Node.js `20+` (Node `22/24` recommended)
- `pnpm 9+`

### 1. Install & configure

```bash
pnpm install
cp .env.example .env
```

### 2. Initialize & seed the local database

```bash
pnpm db:push
pnpm db:seed
```

### 3. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Demo accounts** (seeded by `pnpm db:seed`, password for all: `domus123`):
> - **Aarav (Head of Household)** — `aarav@domus.local` (`HEAD`)
> - **Meera (Co-Head)** — `meera@domus.local` (`CO_HEAD`)
> - **Rohan (Family Member)** — `rohan@domus.local` (`MEMBER`)
> - **Ananya (Junior)** — `ananya@domus.local` (`JUNIOR`)
> - **Priya Auntie (Guest / Helper)** — `priya@domus.local` (`GUEST`)
>
> You can also use the **Role Switcher** in the header (when `NEXT_PUBLIC_ENABLE_DEMO_SWITCHER=true`) to immediately experience how permissions and private-event redaction adapt across roles.

---

## Repository Layout

```text
Domus/
├── docs/
│   ├── PRD.md            # Product Requirements Document
│   ├── ARCHITECTURE.md   # System & database architecture
│   ├── PERMISSIONS.md    # Role-based access control & privacy model
│   └── ROADMAP.md        # Phased delivery roadmap
├── public/
│   └── manifest.json     # PWA manifest
├── src/
│   ├── app/              # Next.js App Router pages & REST API routes
│   ├── components/       # Modular UI views (Dashboard, Calendar, Trackers, Lists, Family)
│   ├── db/               # Drizzle schema, SQLite client, and household seeder
│   └── lib/              # RBAC engine, session auth, schedule overlap engine, Zod schemas
└── tests/                # Vitest suites for RBAC and time-booking overlap logic
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js development server on port 3000 |
| `pnpm build` | Production build check |
| `pnpm typecheck` | TypeScript strict type check |
| `pnpm test` | Run Vitest unit tests (RBAC + Overlap Engine) |
| `pnpm db:push` | Push Drizzle schema to SQLite |
| `pnpm db:seed` | Seed realistic multi-role household data |

---

Built under **[Oblivion Labs](https://github.com/Oblivion-Labs-Dev)**.
