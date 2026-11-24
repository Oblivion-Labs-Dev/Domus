# Domus — Family Roles & Permissions Model (RBAC)

Domus models a real household hierarchy rather than flat "everyone is an admin" sharing.

## 1. Role Hierarchy

1. **`HEAD` (Head of Household)** — Governance authority; full access across household settings, member roles, audit logs, and overrides.
2. **`CO_HEAD` (Co-Head / Partner)** — Operational co-leader; manages shared plans, assigns chores, approves Junior booking requests, and invites standard members/guests.
3. **`MEMBER` (Family Member)** — Full personal autonomy (own exercise, diet, life plans, private blocks) + collaborative access to shared lists and peer time-booking.
4. **`JUNIOR` (Child / Teen)** — Structured participation: can view family schedules, check off assigned chores, log personal trackers, and **request** time bookings (routed for approval by target or Head/Co-Head).
5. **`GUEST` (Helper / Relative / Caregiver)** — Scoped operational access to shared shopping/meal/chore lists and public family events; zero access to private events, health logs, or household governance.

---

## 2. Permission Matrix

| Capability | `HEAD` | `CO_HEAD` | `MEMBER` | `JUNIOR` | `GUEST` |
|---|:---:|:---:|:---:|:---:|:---:|
| View public/family calendar events | ✅ | ✅ | ✅ | ✅ | ✅ |
| View `ADULTS_ONLY` events | ✅ | ✅ | ✅ | ❌ | ❌ |
| View own `PRIVATE` events | ✅ | ✅ | ✅ | ✅ | ✅ |
| See others' `PRIVATE` events as `"Busy"` | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create personal calendar events | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create shared family-wide events | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit / delete any household event | ✅ | ✅ | Own only | Own only | ❌ |
| Book another member's time | ✅ | ✅ | ✅ | Request (Needs Approval) | ❌ |
| Force-approve / override time bookings | ✅ | ✅ (Junior) | ❌ | ❌ | ❌ |
| View & log own exercise / diet / plans | ✅ | ✅ | ✅ | ✅ | ❌ |
| View shared family wellness trackers | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add & check off shared shopping/chore items | ✅ | ✅ | ✅ | Assigned / Shopping | ✅ |
| Create or delete household lists | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign chores to other family members | ✅ | ✅ | ✅ | ❌ | ❌ |
| Invite members & manage roles | ✅ | Invite only | ❌ | ❌ | ❌ |
| View household audit log | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 3. Per-Member Overrides

In real families, roles aren't rigid (e.g., an older teenager who is a `MEMBER` or `JUNIOR` might be trusted to manage the grocery list, or a visiting grandparent who is a `GUEST` might be allowed to view the family diet plan).

Each `member` record supports granular JSON overrides:
- `canApproveBookings`: Allow member to approve pending booking requests
- `canManageLists`: Allow creating/deleting lists and reassigning chores
- `canViewAllHealth`: Allow viewing shared family health/diet trackers (useful for caregivers)
- `canBookWithoutApproval`: Exempt a `JUNIOR` from requiring Head/Co-Head co-approval

All overrides are managed exclusively by the **Head of Household (`HEAD`)** and recorded in `audit_logs`.
