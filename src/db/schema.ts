import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const households = sqliteTable("households", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  houseKey: text("house_key").notNull().default("DOMUS-HOME"),
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

export const houseResources = sqliteTable("house_resources", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("GEAR"), // VEHICLE | YARD | WELLNESS | KITCHEN
  iconAsset: text("icon_asset").notNull().default("/assets/decor-car.png"),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").notNull().default("FAMILY"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  participantIdsJson: text("participant_ids_json").notNull().default("[]"),
  resourceId: text("resource_id").references(() => houseResources.id, {
    onDelete: "set null",
  }),
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
  resourceId: text("resource_id").references(() => houseResources.id, {
    onDelete: "set null",
  }),
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

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(), // COMMON | PERSONAL
  ownerId: text("owner_id").references(() => members.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description").default(""),
  createdAt: text("created_at").notNull(),
});

export const boardColumns = sqliteTable("board_columns", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  color: text("color").notNull().default("#787164"),
  iconAsset: text("icon_asset").default(""),
  position: integer("position").notNull().default(0),
});

export const boardCards = sqliteTable("board_cards", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  columnId: text("column_id")
    .notNull()
    .references(() => boardColumns.id, { onDelete: "cascade" }),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  cardType: text("card_type").notNull().default("TASK"), // TASK | NOTE
  noteColor: text("note_color").notNull().default("cream"), // cream | butter | terracotta | sage | sky
  iconAsset: text("icon_asset").default(""),
  tagsJson: text("tags_json").notNull().default("[]"),
  priority: text("priority").notNull().default("MEDIUM"), // LOW | MEDIUM | HIGH | URGENT
  assigneeId: text("assignee_id").references(() => members.id, {
    onDelete: "set null",
  }),
  resourceId: text("resource_id").references(() => houseResources.id, {
    onDelete: "set null",
  }),
  dueDate: text("due_date").default(""),
  startTime: text("start_time").default(""),
  endTime: text("end_time").default(""),
  syncToCommonCalendar: integer("sync_to_common_calendar", { mode: "boolean" })
    .notNull()
    .default(true),
  linkedEventId: text("linked_event_id").references(() => calendarEvents.id, {
    onDelete: "set null",
  }),
  position: integer("position").notNull().default(0),
  createdById: text("created_by_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

export const roomConfigs = sqliteTable("room_configs", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  ownerKey: text("owner_key").notNull(), // "COMMON" or memberId
  roomTitle: text("room_title").notNull(),
  theme: text("theme").notNull().default("stone"), // stone | sage | terracotta | butter | midnight
  bannerQuote: text("banner_quote").default(""),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  layoutJson: text("layout_json")
    .notNull()
    .default('["board","trackers","stickies"]'),
  decorItemsJson: text("decor_items_json").notNull().default("[]"),
  updatedAt: text("updated_at").notNull(),
});

export const roomKnocks = sqliteTable("room_knocks", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  roomOwnerId: text("room_owner_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: text("status").notNull().default("KNOCKING"), // KNOCKING | ALLOWED | DECLINED | REVOKED
  createdAt: text("created_at").notNull(),
  respondedAt: text("responded_at"),
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
  cadence: text("cadence").notNull().default("WEEKLY"),
  visibility: text("visibility").notNull().default("FAMILY"),
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
  date: text("date").notNull(),
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
  type: text("type").notNull(),
  description: text("description").default(""),
  dueDate: text("due_date").default(""),
  visibility: text("visibility").notNull().default("FAMILY"),
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
  priority: text("priority").notNull().default("MEDIUM"),
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

export const housePolls = sqliteTable("house_polls", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  tag: text("tag").notNull().default("home"),
  optionsJson: text("options_json").notNull().default("[]"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

export const fridgeMeals = sqliteTable("fridge_meals", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  mealType: text("meal_type").notNull().default("DINNER"), // BREAKFAST | LUNCH | DINNER
  dish: text("dish").notNull(),
  chefId: text("chef_id").references(() => members.id, { onDelete: "set null" }),
  notes: text("notes").default(""),
  linkedEventId: text("linked_event_id").references(() => calendarEvents.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull(),
});

export const groupWorkouts = sqliteTable("group_workouts", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  exercisesJson: text("exercises_json").notNull().default("[]"),
  participantIdsJson: text("participant_ids_json").notNull().default("[]"),
  completedIdsJson: text("completed_ids_json").notNull().default("[]"),
  linkedEventId: text("linked_event_id").references(() => calendarEvents.id, {
    onDelete: "set null",
  }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => members.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});
