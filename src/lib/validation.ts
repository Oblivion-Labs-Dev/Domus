import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const demoSwitchSchema = z.object({
  memberId: z.string().min(1),
});

export const createEventSchema = z
  .object({
    title: z.string().min(1).max(120),
    category: z
      .enum([
        "FAMILY",
        "BIRTHDAY",
        "HOLIDAY",
        "EXERCISE",
        "DIET",
        "DRIVING",
        "YOGA",
        "SHOPPING",
        "CHORE",
        "PERSONAL",
        "BOOKING",
      ])
      .default("FAMILY"),
    participantIds: z.array(z.string()).default([]),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    visibility: z.enum(["FAMILY", "ADULTS_ONLY", "PRIVATE"]).default("FAMILY"),
    isShared: z.boolean().default(false),
    location: z.string().max(120).optional().default(""),
    notes: z.string().max(500).optional().default(""),
  })
  .refine((d) => new Date(d.endTime).getTime() > new Date(d.startTime).getTime(), {
    message: "End time must be after start time",
  });

export const createBookingSchema = z
  .object({
    targetMemberId: z.string().min(1),
    title: z.string().min(1).max(120),
    category: z.string().default("BOOKING"),
    notes: z.string().max(400).optional().default(""),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
  })
  .refine((d) => new Date(d.endTime).getTime() > new Date(d.startTime).getTime(), {
    message: "End time must be after start time",
  });

export const respondBookingSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE", "CANCEL", "APPROVE"]),
});

export const createTrackerSchema = z.object({
  type: z.enum(["EXERCISE", "DIET", "LIFE_PLAN"]),
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  unit: z.string().min(1).max(30),
  targetValue: z.number().positive(),
  cadence: z.enum(["DAILY", "WEEKLY", "MILESTONE"]).default("WEEKLY"),
  visibility: z.enum(["FAMILY", "PRIVATE"]).default("FAMILY"),
  notes: z.string().max(400).optional().default(""),
});

export const createTrackerLogSchema = z.object({
  trackerId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().positive(),
  note: z.string().max(300).optional().default(""),
});

export const createListSchema = z.object({
  title: z.string().min(1).max(100),
  type: z.string().max(120).optional().default("GENERAL"),
  description: z.string().max(300).optional().default(""),
  visibility: z.enum(["FAMILY", "ADULTS_ONLY"]).default("FAMILY"),
});

export const createListItemSchema = z.object({
  listId: z.string().min(1),
  title: z.string().min(1).max(140),
  category: z.string().max(50).optional().default("General"),
  quantity: z.string().max(40).optional().default(""),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().max(30).optional().default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export const updateListItemSchema = z.object({
  listId: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  title: z.string().min(1).max(140).optional(),
  dueDate: z.string().max(30).optional(),
});

export const inviteMemberSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).default("domus123"),
  role: z.enum(["HEAD", "CO_HEAD", "MEMBER", "JUNIOR", "GUEST"]),
  title: z.string().min(1).max(60).default("Family Member"),
  color: z.string().default("#4f7c5b"),
});

export const updateMemberSchema = z.object({
  role: z.enum(["HEAD", "CO_HEAD", "MEMBER", "JUNIOR", "GUEST"]).optional(),
  title: z.string().min(1).max(60).optional(),
  permissions: z
    .object({
      canApproveBookings: z.boolean().optional(),
      canManageLists: z.boolean().optional(),
      canViewAllHealth: z.boolean().optional(),
      canBookWithoutApproval: z.boolean().optional(),
    })
    .optional(),
});
