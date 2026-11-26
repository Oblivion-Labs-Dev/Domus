import type { PermissionOverrides, Role } from "@/lib/rbac";
import type { NoteColorId, PlacedDecor, RoomThemeId } from "@/lib/decor";

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
  avatarId?: string | null;
  permissions: PermissionOverrides;
  createdAt?: string;
}

export interface HouseResourceDTO {
  id: string;
  name: string;
  category: string;
  iconAsset: string;
  notes: string | null;
  status: "AVAILABLE" | "IN_USE";
  currentEventTitle: string | null;
  nextBooking: {
    title: string;
    startTime: string;
    endTime: string;
  } | null;
}

export interface CalendarEventDTO {
  id: string;
  title: string;
  category: string;
  ownerId: string;
  participantIds: string[];
  resourceId: string | null;
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
  resourceId?: string | null;
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

export interface BoardDTO {
  id: string;
  scope: "COMMON" | "PERSONAL";
  ownerId: string | null;
  title: string;
  description: string | null;
}

export interface BoardColumnDTO {
  id: string;
  boardId: string;
  title: string;
  color: string;
  position: number;
}

export interface BoardCardDTO {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string | null;
  cardType: "TASK" | "NOTE";
  noteColor: NoteColorId;
  tags: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId: string | null;
  resourceId: string | null;
  dueDate: string | null;
  startTime: string | null;
  endTime: string | null;
  syncToCommonCalendar: boolean;
  linkedEventId: string | null;
  position: number;
  createdById: string;
}

export interface RoomConfigDTO {
  id: string;
  ownerKey: string;
  roomTitle: string;
  theme: RoomThemeId;
  bannerQuote: string;
  layout: string[];
  decorItems: PlacedDecor[];
}

export interface RoomKnockDTO {
  id: string;
  visitorId: string;
  roomOwnerId: string;
  message: string;
  status: "KNOCKING" | "ALLOWED" | "DECLINED" | "REVOKED";
  createdAt: string;
  respondedAt: string | null;
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

export type ActiveTab = "common" | "room" | "calendar" | "family";

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
