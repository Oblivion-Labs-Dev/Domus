# Domus — Product Requirements Document (v2 — Real House Model)

## 1. Vision

Domus is a digital twin of a real home: a **Common Area** where shared household work, notes, gear, and schedules live, paired with **Private Personal Rooms** that each family member can decorate and organize however they like.

---

## 2. Core Spaces

### 2.1 The Common Area *(Default Landing)*
- **Interactive Drag-and-Drop House Board**:
  - Customizable columns (`Open / Unclaimed`, `Picked Up`, `In Progress`, `Done`, plus any user-created columns).
  - Rich 2.5D task cards & colored sticky notes with tags, priority, House Gear attachments, and deadlines.
  - **1-Click Pick Up**: Any family member can claim an unclaimed task (e.g., *Lawn Mowing*) → it assigns to them, moves to *Picked Up*, and links directly to their Personal Room.
  - **Auto-Calendar Sync**: Adding a date/time to a card automatically schedules it onto the Common & Personal Calendar.
- **Shared House Gear**:
  - Shared physical items (`Family Car`, `Lawn Mower`, `Home Gym`, `Kitchen Oven`) are attached as tags on board cards or calendar events.
  - Live `Free Now` / `In Use` status strip; double-booking is blocked automatically by the Overlap Engine.
- **2.5D Decor Studio**: Members can customize the Common Wall theme and place 2.5D clay objects.
- **Shared Checklists**: Collaborative Shopping, Meal Prep, and Yard/Home Chore lists.

### 2.2 Personal Rooms *(Flexible & Private by Default)*
- **Universal Knock-to-Visit Privacy**: No family member — including the Head of Household — can silently peek into another person's room. Visitors send a **Knock with a message**, and the owner can **Let In**, **Decline**, or **Close Door (Revoke)** anytime.
- **Arrange Your Room Your Way**:
  - Choose from 5 wall themes (`Warm Stone`, `Sunlit Sage`, `Terracotta Clay`, `Morning Sun`, `Midnight Studio`).
  - Place/remove 2.5D miniature decor objects on the room shelf.
  - Reorder room sections (`Personal Board`, `Personal Trackers`) freely.
  - Manage personal drag-and-drop columns, sticky notes, claimed house tasks, and personal exercise/diet/driving trackers.

### 2.3 Multi-View Calendar *(Daily · Weekly · Yearly)*
- **Daily View**: Hourly schedule (`7 AM – 9 PM`) showing overlapping family plans, House Gear reservations, and private `"Busy"` blocks.
- **Weekly View**: 7-day Google/Notion-style grid for spotting overlaps and open windows.
- **Yearly View**: Full 12-month heatmap; click any date to zoom into Daily View.
- **Time-Booking**: Pick a family member and duration to view conflict-free slots and send a booking request (`Pending` or `Awaiting Head Approval` for Juniors).

### 2.4 Family & Doors *(Governance + Hallway)*
- Visual 2.5D hallway of every member's door with Knock status and messaging.
- 5-tier household RBAC (`HEAD`, `CO_HEAD`, `MEMBER`, `JUNIOR`, `GUEST`) with Head-managed roles, overrides, and audit logging.
