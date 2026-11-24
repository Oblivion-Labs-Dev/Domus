import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const households = sqliteTable("households", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  quietHoursStart: text("quiet_hours_start").notNull().default("22:00"),
  quietHoursEnd: text("quiet_hours_end").notNull().default("07:00"),
  createdAt: text("created_at").notNull(),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // HEAD | CO_HEAD | MEMBER | JUNIOR | GUEST
  title: text("title").notNull().default("Family Member"),
  color: text("color").notNull().default("#4f7c5b"),
  avatarInitials: text("avatar_initials").notNull(),
  permissionsJson: text("permissions_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("FAMILY"), // FAMILY | EXERCISE | DIET | DRIVING | YOGA | SHOPPING | CHORE | PERSONAL | BOOKING
  ownerId: text("owner_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  participantIdsJson: text("participant_ids_json").notNull().default("[]"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  visibility: text("visibility").notNull().default("FAMILY"), // FAMILY | ADULTS_ONLY | PRIVATE
  isShared: integer("is_shared", { mode: "boolean" }).notNull().default(false),
  location: text("location").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
});

export const timeBookings = sqliteTable("time_bookings", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  requesterId: text("requester_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  targetMemberId: text("target_member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("BOOKING"),
  notes: text("notes").default(""),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING | AWAITING_HEAD_APPROVAL | ACCEPTED | DECLINED | CANCELLED
  approvedById: text("approved_by_id").references(() => members.id, {
    onDelete: "set null",
  }),
  createdEventId: text("created_event_id").references(() => calendarEvents.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull(),
});

export const trackers = sqliteTable("trackers", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // EXERCISE | DIET | LIFE_PLAN
  title: text("title").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  targetValue: real("target_value").notNull(),
  currentValue: real("current_value").notNull().default(0),
  cadence: text("cadence").notNull().default("WEEKLY"), // DAILY | WEEKLY | MILESTONE
  visibility: text("visibility").notNull().default("FAMILY"), // FAMILY | PRIVATE
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
});

export const trackerLogs = sqliteTable("tracker_logs", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  trackerId: text("tracker_id")
    .notNull()
    .references(() => trackers.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  value: real("value").notNull(),
  note: text("note").default(""),
  createdAt: text("created_at").notNull(),
});

export const householdLists = sqliteTable("household_lists", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // SHOPPING | MEAL_PREP | CHORES | GENERAL
  description: text("description").default(""),
  visibility: text("visibility").notNull().default("FAMILY"), // FAMILY | ADULTS_ONLY
  createdById: text("created_by_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

export const listItems = sqliteTable("list_items", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => householdLists.id, { onDelete: "cascade" }),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").default("General"),
  quantity: text("quantity").default(""),
  assigneeId: text("assignee_id").references(() => members.id, {
    onDelete: "set null",
  }),
  dueDate: text("due_date").default(""),
  priority: text("priority").notNull().default("MEDIUM"), // LOW | MEDIUM | HIGH
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  completedById: text("completed_by_id").references(() => members.id, {
    onDelete: "set null",
  }),
  completedAt: text("completed_at"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  actorId: text("actor_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  summary: text("summary").notNull(),
  createdAt: text("created_at").notNull(),
});
