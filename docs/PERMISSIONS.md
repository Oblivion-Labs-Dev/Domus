# Domus — Family Roles & Universal Room Privacy (v2)

## 1. Universal Knock-to-Visit Room Privacy

Every member's Personal Room is **private by default**:
- **No silent peeking** — not even `HEAD` or `CO_HEAD` can open another member's room without knocking.
- Visiting requires sending a **Knock** (`POST /api/rooms/knocks`) with a personal message.
- Only the **room owner** can answer knocks (`ALLOWED`, `DECLINED`) or close their door later (`REVOKED`).
- Enforced server-side via `canEnterRoom()` in `src/lib/rbac.ts` on both `/api/rooms` and `/api/boards?scope=PERSONAL`.

---

## 2. Household Role Hierarchy

| Role | Responsibility |
|---|---|
| **`HEAD`** | Household admin: manages roles, permission overrides, House Gear, Junior booking approvals, and audit log. Still knocks on private rooms. |
| **`CO_HEAD`** | Co-leads daily operations: manages common boards, invites members, approves Junior bookings, manages House Gear. |
| **`MEMBER`** | Full personal room autonomy, picks up common tasks, creates shared events, books family time & House Gear. |
| **`JUNIOR`** | Full personal room autonomy, picks up common tasks, logs trackers, requests time bookings (routed for Head/Co-Head approval). |
| **`GUEST`** | Collaborates on the Common Board and shared checklists; read-only public calendar; cannot book family time or view private blocks. |
