# Domus — Delivery Roadmap

## Phase 1 — MVP (Current Release)
- [x] Next.js 15 + Drizzle ORM + SQLite local-first foundation
- [x] Real family authentication (signed session cookies) + 5-tier RBAC (`HEAD`, `CO_HEAD`, `MEMBER`, `JUNIOR`, `GUEST`)
- [x] **Home Pulse** daily household dashboard
- [x] **Common Calendar** with Shared/Overlapping vs. Individual filters & Private-block `"Busy"` redaction
- [x] **Time-Booking Engine** with real-time conflict detection, open-slot finder, and Accept/Decline/Approve workflow
- [x] **Health, Diet & Life Plan Trackers** (Exercise, Diet/Hydration, Driving Lessons, Yoga) with live progress logging
- [x] **Household Lists & Chores** (Shopping, Meal Prep, Lawn Mowing & Yard/Home Chores) with assignees and check-off
- [x] **Family & Permissions Hub** with live RBAC matrix, role editor (`HEAD`), and audit log
- [x] Unit test suite for RBAC rules and schedule overlap detection

## Phase 2 — Daily Rhythm & Mobile Polish
- [ ] Recurring events & recurring chores (e.g., Lawn Mowing every Saturday 9 AM, Yoga Mon/Wed/Fri)
- [ ] Push notifications (Web Push PWA) for time-booking requests, chore assignments, and grocery updates
- [ ] Meal Planner → 1-click "Generate Shopping List Ingredients"
- [ ] Household Resource Booking (e.g., Shared Family Car for Driving Lessons + Grocery Runs)

## Phase 3 — Integrations & Smart Household Assistant
- [ ] Two-way `.ics` / Google Calendar import (display external work meetings as `"Busy"` blocks in Domus)
- [ ] Smart Slot Suggestions ("Best 45-min window for Dad + Rohan's driving practice this week")
- [ ] Weekly Family Digest summary for Head & Co-Head
- [ ] Native mobile wrapper (Capacitor / Expo) & Turso/PostgreSQL cloud sync option
