import type { PermissionOverrides, Role } from "@/lib/rbac";

export interface HouseholdDTO {
  id: string;
  name: string;
  timezone: string;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface MemberDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  color: string;
  avatarInitials: string;
  permissions: PermissionOverrides;
  createdAt?: string;
}

export interface CalendarEventDTO {
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
  hasCollision: boolean;
  isFamilyOverlap: boolean;
}

export interface TimeBookingDTO {
  id: string;
  requesterId: string;
  targetMemberId: string;
  title: string;
  category: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  status: string;
  approvedById: string | null;
  createdEventId: string | null;
  createdAt: string;
}

export interface TrackerDTO {
  id: string;
  memberId: string;
  type: "EXERCISE" | "DIET" | "LIFE_PLAN";
  title: string;
  category: string;
  unit: string;
  targetValue: number;
  currentValue: number;
  cadence: "DAILY" | "WEEKLY" | "MILESTONE";
  visibility: "FAMILY" | "PRIVATE";
  notes: string | null;
}

export interface TrackerLogDTO {
  id: string;
  trackerId: string;
  memberId: string;
  date: string;
  value: number;
  note: string | null;
  createdAt: string;
}

export interface ListItemDTO {
  id: string;
  listId: string;
  title: string;
  category: string | null;
  quantity: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  isCompleted: boolean;
  completedById: string | null;
  createdById: string;
}

export interface HouseholdListDTO {
  id: string;
  title: string;
  type: "SHOPPING" | "MEAL_PREP" | "CHORES" | "GENERAL";
  description: string | null;
  visibility: string;
  items: ListItemDTO[];
}

export interface AuditLogDTO {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  summary: string;
  createdAt: string;
}

export type ActiveTab =
  | "dashboard"
  | "calendar"
  | "trackers"
  | "lists"
  | "family";

export function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString([], opts)} – ${end.toLocaleTimeString([], opts)}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
