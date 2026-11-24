export type Role = "HEAD" | "CO_HEAD" | "MEMBER" | "JUNIOR" | "GUEST";

export interface PermissionOverrides {
  canApproveBookings?: boolean;
  canManageLists?: boolean;
  canViewAllHealth?: boolean;
  canBookWithoutApproval?: boolean;
}

export interface MemberContext {
  id: string;
  householdId: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  color: string;
  avatarInitials: string;
  permissions: PermissionOverrides;
}

export type PermissionAction =
  | "calendar:create_personal"
  | "calendar:create_shared"
  | "calendar:edit_any"
  | "calendar:view_adults_only"
  | "booking:create"
  | "booking:approve_others"
  | "tracker:create_own"
  | "tracker:view_shared"
  | "list:create_or_delete"
  | "list:add_item"
  | "list:assign_others"
  | "family:invite_member"
  | "family:manage_roles"
  | "family:view_audit_log";

export const ROLE_META: Record<
  Role,
  { label: string; badge: string; description: string; rank: number }
> = {
  HEAD: {
    label: "Head of Household",
    badge: "Head",
    description:
      "Full governance over roles, permissions, household settings, approvals, and schedules.",
    rank: 5,
  },
  CO_HEAD: {
    label: "Co-Head",
    badge: "Co-Head",
    description:
      "Co-leads daily operations: manages shared schedules, assigns chores, invites members, and approves Junior bookings.",
    rank: 4,
  },
  MEMBER: {
    label: "Family Member",
    badge: "Member",
    description:
      "Manages own workouts, diet, life plans, and private blocks; collaborates on shared lists and peer time-booking.",
    rank: 3,
  },
  JUNIOR: {
    label: "Junior",
    badge: "Junior",
    description:
      "Views family schedule, checks off assigned chores, logs personal habits, and requests time bookings with adult approval.",
    rank: 2,
  },
  GUEST: {
    label: "Guest / Helper",
    badge: "Guest",
    description:
      "Scoped access to shared shopping, meal prep, and chore lists plus public family events; no private or health access.",
    rank: 1,
  },
};

export const ROLE_CAPABILITY_MATRIX: {
  action: PermissionAction;
  label: string;
  roles: Record<Role, boolean | string>;
}[] = [
  {
    action: "calendar:create_personal",
    label: "Create personal schedule blocks",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: true, GUEST: false },
  },
  {
    action: "calendar:create_shared",
    label: "Schedule shared family-wide events",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: false, GUEST: false },
  },
  {
    action: "calendar:edit_any",
    label: "Edit or delete any member's event",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: "Own", JUNIOR: "Own", GUEST: false },
  },
  {
    action: "booking:create",
    label: "Book another member's time",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: "Approval", GUEST: false },
  },
  {
    action: "booking:approve_others",
    label: "Approve Junior / household booking requests",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: false, JUNIOR: false, GUEST: false },
  },
  {
    action: "tracker:create_own",
    label: "Track exercise, diet & life plans",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: true, GUEST: false },
  },
  {
    action: "list:create_or_delete",
    label: "Create or delete household lists",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: false, GUEST: false },
  },
  {
    action: "list:add_item",
    label: "Add & check off shopping / chore items",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: true, GUEST: true },
  },
  {
    action: "list:assign_others",
    label: "Assign chores to other members",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: true, JUNIOR: false, GUEST: false },
  },
  {
    action: "family:invite_member",
    label: "Invite new household members",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: false, JUNIOR: false, GUEST: false },
  },
  {
    action: "family:manage_roles",
    label: "Change roles & permission overrides",
    roles: { HEAD: true, CO_HEAD: false, MEMBER: false, JUNIOR: false, GUEST: false },
  },
  {
    action: "family:view_audit_log",
    label: "View household audit log",
    roles: { HEAD: true, CO_HEAD: true, MEMBER: false, JUNIOR: false, GUEST: false },
  },
];

export function parsePermissions(raw: string | null | undefined): PermissionOverrides {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function can(member: MemberContext, action: PermissionAction): boolean {
  const { role, permissions } = member;

  switch (action) {
    case "calendar:create_personal":
      return role !== "GUEST";
    case "calendar:create_shared":
      return role === "HEAD" || role === "CO_HEAD" || role === "MEMBER";
    case "calendar:edit_any":
      return role === "HEAD" || role === "CO_HEAD";
    case "calendar:view_adults_only":
      return role === "HEAD" || role === "CO_HEAD" || role === "MEMBER";
    case "booking:create":
      return role !== "GUEST";
    case "booking:approve_others":
      return role === "HEAD" || role === "CO_HEAD" || Boolean(permissions.canApproveBookings);
    case "tracker:create_own":
      return role !== "GUEST";
    case "tracker:view_shared":
      return role !== "GUEST" || Boolean(permissions.canViewAllHealth);
    case "list:create_or_delete":
      return (
        role === "HEAD" ||
        role === "CO_HEAD" ||
        role === "MEMBER" ||
        Boolean(permissions.canManageLists)
      );
    case "list:add_item":
      return true;
    case "list:assign_others":
      return (
        role === "HEAD" ||
        role === "CO_HEAD" ||
        role === "MEMBER" ||
        Boolean(permissions.canManageLists)
      );
    case "family:invite_member":
      return role === "HEAD" || role === "CO_HEAD";
    case "family:manage_roles":
      return role === "HEAD";
    case "family:view_audit_log":
      return role === "HEAD" || role === "CO_HEAD";
    default:
      return false;
  }
}

export function requiresHeadApprovalForBooking(requester: MemberContext): boolean {
  if (requester.role !== "JUNIOR") return false;
  return !requester.permissions.canBookWithoutApproval;
}

export interface RawCalendarEvent {
  id: string;
  householdId: string;
  title: string;
  category: string;
  ownerId: string;
  participantIdsJson: string;
  startTime: string;
  endTime: string;
  visibility: string;
  isShared: boolean;
  location: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SafeCalendarEvent {
  id: string;
  title: string;
  category: string;
  ownerId: string;
  participantIds: string[];
  startTime: string;
  endTime: string;
  visibility: string;
  isShared: boolean;
  location: string;
  notes: string;
  isRedacted: boolean;
}

/**
 * Redacts or filters a calendar event according to the viewing member's role.
 * - PRIVATE events are shown in full to the owner (and participants),
 *   redacted as "Busy" to other household members (so availability & time-booking stay accurate),
 *   and completely hidden from GUESTs.
 * - ADULTS_ONLY events are hidden from JUNIOR and GUEST members.
 */
export function redactEventForViewer(
  event: RawCalendarEvent,
  viewer: MemberContext
): SafeCalendarEvent | null {
  let participantIds: string[] = [];
  try {
    const parsed = JSON.parse(event.participantIdsJson);
    if (Array.isArray(parsed)) participantIds = parsed;
  } catch {
    participantIds = [];
  }

  const isParticipant =
    event.ownerId === viewer.id || participantIds.includes(viewer.id);

  if (event.visibility === "ADULTS_ONLY") {
    if (!can(viewer, "calendar:view_adults_only") && !isParticipant) {
      return null;
    }
  }

  if (event.visibility === "PRIVATE" && !isParticipant) {
    if (viewer.role === "GUEST") {
      return null;
    }
    return {
      id: event.id,
      title: "Busy (Private Block)",
      category: "PERSONAL",
      ownerId: event.ownerId,
      participantIds: [event.ownerId],
      startTime: event.startTime,
      endTime: event.endTime,
      visibility: "PRIVATE",
      isShared: false,
      location: "",
      notes: "",
      isRedacted: true,
    };
  }

  return {
    id: event.id,
    title: event.title,
    category: event.category,
    ownerId: event.ownerId,
    participantIds:
      participantIds.length > 0 ? participantIds : [event.ownerId],
    startTime: event.startTime,
    endTime: event.endTime,
    visibility: event.visibility,
    isShared: event.isShared,
    location: event.location ?? "",
    notes: event.notes ?? "",
    isRedacted: false,
  };
}

export function canViewTracker(
  tracker: { memberId: string; visibility: string },
  viewer: MemberContext
): boolean {
  if (tracker.memberId === viewer.id) return true;
  if (tracker.visibility === "PRIVATE") {
    return viewer.role === "HEAD";
  }
  return can(viewer, "tracker:view_shared");
}

export function canViewList(
  list: { visibility: string },
  viewer: MemberContext
): boolean {
  if (list.visibility === "ADULTS_ONLY") {
    return can(viewer, "calendar:view_adults_only");
  }
  return true;
}

export function canEditOrDeleteEvent(
  event: { ownerId: string },
  actor: MemberContext
): boolean {
  if (actor.role === "GUEST") return false;
  if (event.ownerId === actor.id) return true;
  return can(actor, "calendar:edit_any");
}
