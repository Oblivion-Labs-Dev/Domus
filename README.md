# Domus

**A digital twin of a real house — shared living room boards, private customizable rooms, universal Knock-to-Visit privacy, House Gear conflict prevention, and a Daily/Weekly/Yearly family calendar.**

> Lighter and more personal than Notion. Deeper and more home-native than Google Calendar.

---

## Core Architecture: The "Real House" Model

Domus is organized like an actual home instead of generic productivity tabs:

1. **Common Area *(Shared Living Room)***
   - **Drag-and-Drop House Board**: Create custom columns, pin colored 2.5D sticky notes & task cards, tag priorities, and **Pick Up** unclaimed house chores (e.g., *Mow Front & Back Lawn*, *Costco Run*) with 1 click — automatically assigning them to you and syncing them into your Personal Room.
   - **Auto-Calendar Sync**: Adding a date/time to any board card automatically places it on the Calendar.
   - **Shared House Gear**: Attach shared resources (`Family Car (CR-V)`, `Lawn Mower`, `Home Gym`, `Kitchen Oven`) to any card or calendar block — the Overlap Engine prevents double-booking automatically.
   - **2.5D Decor Studio**: Customize wall themes and place/remove 2.5D matte-clay miniature assets (`Monstera Pot`, `Studio Lamp`, `Yoga Mat`, `Market Tote`, `Family SUV`, `Lawn Mower`).
   - **Shared Checklists**: Collapsible Shopping, Sunday Meal Prep, and Home Chore lists.

2. **My Room *(Private, Flexible Personal Space)***
   - **Universal Knock-to-Visit Privacy**: Nobody can peek into another member's room by default — not even the Head of Household. Visitors knock with a personal message, and the room owner can **Let In**, **Decline**, or **Close Door (Revoke)** anytime.
   - **Arrange Your Space Your Way**: Pick room themes (`Warm Stone`, `Sunlit Sage`, `Terracotta Clay`, `Morning Sun`, `Midnight Studio`), decorate with 2.5D objects, reorder room sections, manage your own drag-and-drop personal board, see claimed house tasks, and log personal exercise/diet/driving trackers.

3. **Multi-View Calendar *(Daily · Weekly · Yearly)***
   - **Daily View**: Hourly timeline (`7 AM – 9 PM`) with overlapping family moments, House Gear tags, and private `"Busy"` blocks.
   - **Weekly View**: 7-day Google/Notion-style grid to visually spot overlaps and open windows.
   - **Yearly View**: Full 12-month activity heatmap — click any day to zoom straight into Daily View.
   - **Book Someone's Time**: Live conflict-free slot finder respecting both personal private blocks and House Gear availability.

4. **Family & Doors *(Hallway + Role-Based Governance)***
   - Browse every member's 2.5D door, knock with a message, or step inside once allowed.
   - Real household roles (`HEAD`, `CO_HEAD`, `MEMBER`, `JUNIOR`, `GUEST`), Junior booking approvals, and governance audit log.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **UI & Motion**: Tailwind CSS + Framer Motion (2.5D tilt cards, spring pills, bespoke matte-clay 2.5D assets) + Lucide Icons
- **Database**: SQLite via Drizzle ORM + `@libsql/client` (local-first `./data/domus.db`; upgrades cleanly to Turso/PostgreSQL)
- **Auth & RBAC**: Signed HTTP-only session cookies (`scrypt` + HMAC-SHA256) with server-enforced RBAC & room-knock guards
- **Testing**: Vitest unit tests (`tests/rbac.test.ts`, `tests/schedule.test.ts`)

---

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or `pnpm exec next dev --port 3005`).

> **Seeded Demo Accounts** (password for all: `domus123`):
> - **Aarav** (`aarav@domus.local`) — `HEAD` (Head of Household)
> - **Meera** (`meera@domus.local`) — `CO_HEAD`
> - **Rohan** (`rohan@domus.local`) — `MEMBER`
> - **Ananya** (`ananya@domus.local`) — `JUNIOR`
> - **Priya Auntie** (`priya@domus.local`) — `GUEST`

---

## Documentation

- [docs/PRD.md](docs/PRD.md) — Product Requirements & Real House Model
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System Architecture, Database Schema & Overlap Engine
- [docs/PERMISSIONS.md](docs/PERMISSIONS.md) — Household RBAC & Universal Knock-to-Visit Privacy
- [docs/ROADMAP.md](docs/ROADMAP.md) — Delivery Roadmap

Built under **[Oblivion Labs](https://github.com/Oblivion-Labs-Dev)**.
