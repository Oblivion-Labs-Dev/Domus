# Domus — Product Requirements Document (PRD)

## 1. Vision & Problem Statement

Modern households juggle two distinct layers of daily life:
1. **Shared / Overlapping Coordination**: Family dinners, grocery runs, meal prep, lawn mowing, car sharing, and needing another family member's time (e.g., asking a parent for a driving lesson or coordinating errands).
2. **Individual Routines & Goals**: Personal workouts, yoga streaks, diet & hydration targets, driving lesson hours, medical appointments, and personal focus blocks.

Existing tools fail households at opposite extremes:
- **Notion** requires endless manual template design, is sluggish on phones, and lacks native household time-booking or conflict awareness.
- **Google Calendar** handles bare calendar events well, but has no concept of household roles, diet/exercise trackers, shared shopping/chore lists, or family booking approvals.

**Domus** bridges this gap: a fast, opinionated, privacy-aware **family operating hub** with first-class household roles.

---

## 2. Target Users & Household Roles

| Role | Real-World Persona | Primary Needs |
|---|---|---|
| **Head of Household (`HEAD`)** | Household lead / primary admin | Complete visibility & control, role/permission management, booking approvals, household rule enforcement |
| **Co-Head (`CO_HEAD`)** | Partner / co-lead | Shared schedule orchestration, assigning chores, managing meal plans & lists, approving Junior requests |
| **Member (`MEMBER`)** | Adult family member / older teen | Logging exercise/diet/life plans, viewing household availability, booking family members' time, marking personal events private |
| **Junior (`JUNIOR`)** | Child / younger teen | Seeing family calendar, completing assigned chores & routines, requesting time/rides from adults (requires approval) |
| **Guest (`GUEST`)** | Visiting relative, nanny, or household helper | Accessing shared shopping/meal/chore lists and public household events without seeing private personal schedules or health logs |

---

## 3. Core Product Modules

### 3.1 Home Pulse (Daily Dashboard)
- **Live Family Availability Strip**: Shows who is currently free vs. in an activity, with a 1-click **"Book Time"** button.
- **Today's Overlapping & Individual Timeline**: Highlights moments where 2+ members overlap (shared events or schedule collisions).
- **Pending Time-Booking Inbox**: Incoming and outgoing requests requiring acceptance or Head/Co-Head approval.
- **Daily Wellness & Chore Snapshot**: Quick glance at exercise/diet completion and urgent shopping/chore tasks.

### 3.2 Common Calendar & Time-Booking Engine
- **Unified Family View**: Toggle between **All**, **Overlapping / Shared Only**, and **Individual** schedules, or filter by specific family members.
- **Privacy-First Visibility**:
  - `FAMILY`: Visible with full details to all household members (and `GUEST` if marked public).
  - `ADULTS_ONLY`: Visible to `HEAD`, `CO_HEAD`, and `MEMBER`; hidden from `JUNIOR` and `GUEST`.
  - `PRIVATE`: Shows full details only to the owner (and `HEAD` if override is enabled); all others see a clean `"Busy"` availability block so time-booking still prevents conflicts without exposing private details!
- **Time-Booking Workflow**:
  1. Requester picks a target family member, date, duration, and purpose (e.g., *"Driving practice — highway merge"*).
  2. Domus runs the **Overlap Engine** to surface open slots and warn about existing conflicts.
  3. Request enters `PENDING` status (or `AWAITING_APPROVAL` when a `JUNIOR` books an adult/resource).
  4. Upon acceptance, Domus automatically creates a **Shared Calendar Event** linking both participants.

### 3.3 Health, Diet & Life Plan Trackers
- **Exercise & Movement**: Log workouts (Yoga, Running, Strength, Walking, Cycling) with duration, intensity, and weekly targets.
- **Diet & Nutrition**: Log daily meals, protein/calorie or clean-eating notes, water intake, and link weekly meal plans directly to the Shopping List.
- **Life Plans & Milestones**: Track multi-week goals like **Driving Lessons** (e.g., `14 / 30 hours`), **Morning Yoga Streak**, or **Home Organization Sprint**.

### 3.4 Household Lists & Chores
- Purpose-built list types:
  - **Shopping** (with categories: Produce, Dairy, Pantry, Household, Hardware)
  - **Meal Prep** (prep steps tied to weekly diet/meal plans)
  - **Home & Yard Chores** (Lawn Mowing, Dishes, Trash, Laundry — with assignee, priority, recurrence, and completion status)
- Filter by **Mine**, **Shared**, or **All**, with real-time completion counters.

### 3.5 Family & Permissions Governance
- Visual Role & Permission Matrix so everyone understands household boundaries.
- `HEAD` can add members, promote/demote roles, toggle granular overrides (`canApproveBookings`, `canManageLists`, `canViewAllHealth`), and inspect the **Audit Log** of role/permission changes.

---

## 4. Non-Functional Requirements
- **Speed**: Sub-200ms local API responses; zero heavy WYSIWYG block editors.
- **Mobile-First PWA**: Installable on iOS/Android home screens for grocery aisles and quick logging.
- **Security & Privacy**: Server-side RBAC enforcement on every API endpoint; redacted payloads never leak private event details to unauthorized roles.
- **Zero-Friction Local-First Deployment**: Works immediately with local SQLite (`file:./data/domus.db`) and scales cleanly to Turso/PostgreSQL.
