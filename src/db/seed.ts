import { db, ensureTables } from "./index";
import {
  auditLogs,
  boardCards,
  boardColumns,
  boards,
  calendarEvents,
  householdLists,
  households,
  houseResources,
  listItems,
  members,
  roomConfigs,
  trackers,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { count } from "drizzle-orm";

function dayAt(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateStr(dayOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

/**
 * Clean, minimal starter seed:
 * Just 1–2 real examples per module so the family learns how everything works
 * without cluttering the house with dummy data.
 */
export async function seedIfEmpty(): Promise<boolean> {
  await ensureTables();
  const existing = await db.select({ value: count() }).from(households);
  if ((existing[0]?.value ?? 0) > 0) {
    return false;
  }

  const householdId = "hh_domus";
  const now = new Date().toISOString();
  const defaultPass = hashPassword("domus123");

  await db.insert(households).values({
    id: householdId,
    name: "The Domus Residence",
    timezone: "America/Los_Angeles",
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    createdAt: now,
  });

  // Minimal starter family (3 roles so you can test knocking, booking & permissions right away; add more in Family & Doors)
  await db.insert(members).values([
    {
      id: "mem_head",
      householdId,
      name: "Aarav",
      email: "aarav@domus.local",
      passwordHash: defaultPass,
      role: "HEAD",
      title: "Head of Family",
      color: "#d4633e",
      avatarInitials: "AA",
      permissionsJson: JSON.stringify({
        avatarId: "crown",
        canApproveBookings: true,
        canManageLists: true,
        canViewAllHealth: true,
        canBookWithoutApproval: true,
      }),
      createdAt: now,
    },
    {
      id: "mem_cohead",
      householdId,
      name: "Meera",
      email: "meera@domus.local",
      passwordHash: defaultPass,
      role: "CO_HEAD",
      title: "Co-Head",
      color: "#4f7c5b",
      avatarInitials: "ME",
      permissionsJson: JSON.stringify({
        avatarId: "leaf",
        canApproveBookings: true,
        canManageLists: true,
        canViewAllHealth: true,
      }),
      createdAt: now,
    },
    {
      id: "mem_member",
      householdId,
      name: "Rohan",
      email: "rohan@domus.local",
      passwordHash: defaultPass,
      role: "MEMBER",
      title: "Family Member",
      color: "#3b6fa0",
      avatarInitials: "RO",
      permissionsJson: JSON.stringify({ avatarId: "fox" }),
      createdAt: now,
    },
  ]);

  // 2 Starter House Gear items
  await db.insert(houseResources).values([
    {
      id: "res_car",
      householdId,
      name: "Family Car",
      category: "VEHICLE",
      iconAsset: "/assets/decor-car.png",
      notes: "Shared car for driving lessons & errands",
      createdAt: now,
    },
    {
      id: "res_mower",
      householdId,
      name: "Lawn Mower",
      category: "YARD",
      iconAsset: "/assets/decor-mower.png",
      notes: "Attach to yard chores to prevent double-booking",
      createdAt: now,
    },
  ]);

  // Just 1 example calendar event
  await db.insert(calendarEvents).values([
    {
      id: "evt_example_yoga",
      householdId,
      title: "Example: Morning Family Yoga",
      category: "YOGA",
      ownerId: "mem_cohead",
      participantIdsJson: JSON.stringify(["mem_cohead", "mem_head"]),
      resourceId: null,
      startTime: dayAt(0, 8, 0),
      endTime: dayAt(0, 9, 0),
      visibility: "FAMILY",
      isShared: true,
      location: "Living Room",
      notes: "Sample shared event — delete or add your own!",
      createdAt: now,
    },
  ]);

  // Common Board + Clean Personal Boards
  await db.insert(boards).values([
    {
      id: "brd_common",
      householdId,
      scope: "COMMON",
      ownerId: null,
      title: "Common House Board",
      description:
        "Add tasks or sticky notes, create custom columns, drag cards, or click Pick Up to claim a house chore.",
      createdAt: now,
    },
    {
      id: "brd_head",
      householdId,
      scope: "PERSONAL",
      ownerId: "mem_head",
      title: "Aarav's Personal Board",
      description: "Private by default — add your own columns, notes & tasks.",
      createdAt: now,
    },
    {
      id: "brd_cohead",
      householdId,
      scope: "PERSONAL",
      ownerId: "mem_cohead",
      title: "Meera's Personal Board",
      description: "Private by default — add your own columns, notes & tasks.",
      createdAt: now,
    },
    {
      id: "brd_member",
      householdId,
      scope: "PERSONAL",
      ownerId: "mem_member",
      title: "Rohan's Personal Board",
      description: "Private by default — add your own columns, notes & tasks.",
      createdAt: now,
    },
  ]);

  await db.insert(boardColumns).values([
    { id: "col_common_open", boardId: "brd_common", householdId, title: "Open / Unclaimed", color: "#d4633e", position: 0 },
    { id: "col_common_picked", boardId: "brd_common", householdId, title: "Picked Up", color: "#3b6fa0", position: 1 },
    { id: "col_common_done", boardId: "brd_common", householdId, title: "Done", color: "#4f7c5b", position: 2 },

    { id: "col_head_1", boardId: "brd_head", householdId, title: "To Do", color: "#d4633e", position: 0 },
    { id: "col_head_2", boardId: "brd_head", householdId, title: "In Progress", color: "#3b6fa0", position: 1 },
    { id: "col_head_3", boardId: "brd_head", householdId, title: "Done", color: "#4f7c5b", position: 2 },

    { id: "col_cohead_1", boardId: "brd_cohead", householdId, title: "To Do", color: "#4f7c5b", position: 0 },
    { id: "col_cohead_2", boardId: "brd_cohead", householdId, title: "Done", color: "#787164", position: 1 },

    { id: "col_member_1", boardId: "brd_member", householdId, title: "To Do", color: "#3b6fa0", position: 0 },
    { id: "col_member_2", boardId: "brd_member", householdId, title: "Done", color: "#4f7c5b", position: 1 },
  ]);

  // Just 2 clean starter examples on Common Board + 1 tip note in Aarav's room
  await db.insert(boardCards).values([
    {
      id: "crd_example_lawn",
      boardId: "brd_common",
      columnId: "col_common_open",
      householdId,
      title: "Example: Mow Front & Back Lawn",
      description:
        "Try clicking 'Pick Up' to claim this task into your Room, or click '+ Cal' to schedule it!",
      cardType: "TASK",
      noteColor: "sage",
      tagsJson: JSON.stringify(["lawn", "example"]),
      priority: "MEDIUM",
      assigneeId: null,
      resourceId: "res_mower",
      dueDate: "",
      startTime: "",
      endTime: "",
      syncToCommonCalendar: true,
      position: 0,
      createdById: "mem_head",
      createdAt: now,
    },
    {
      id: "crd_example_note",
      boardId: "brd_common",
      columnId: "col_common_open",
      householdId,
      title: "Welcome! Pin your own notes & chores here",
      description:
        "Drag cards across columns, click '+ Column' to create new sections, or open the 2.5D Shop above to decorate.",
      cardType: "NOTE",
      noteColor: "butter",
      tagsJson: JSON.stringify(["welcome"]),
      priority: "LOW",
      assigneeId: null,
      resourceId: null,
      dueDate: "",
      startTime: "",
      endTime: "",
      syncToCommonCalendar: false,
      position: 1,
      createdById: "mem_head",
      createdAt: now,
    },
  ]);

  // Clean Room Configs (just 1 starter plant so the Shop feels inviting!)
  await db.insert(roomConfigs).values([
    {
      id: "rc_common",
      householdId,
      ownerKey: "COMMON",
      roomTitle: "The Common Living Room",
      theme: "stone",
      bannerQuote: "Open the 2.5D Decor Shop to make this space yours.",
      layoutJson: JSON.stringify(["board"]),
      decorItemsJson: JSON.stringify([
        { uid: "d_c1", assetId: "decor-plant", label: "Welcome Plant" },
      ]),
      updatedAt: now,
    },
    {
      id: "rc_head",
      householdId,
      ownerKey: "mem_head",
      roomTitle: "Aarav's Room",
      theme: "stone",
      bannerQuote: "Click 'Open 2.5D Decor Shop' to furnish your private space.",
      layoutJson: JSON.stringify(["board", "trackers"]),
      decorItemsJson: JSON.stringify([
        { uid: "d_h1", assetId: "decor-lamp", label: "Desk Lamp" },
      ]),
      updatedAt: now,
    },
    {
      id: "rc_cohead",
      householdId,
      ownerKey: "mem_cohead",
      roomTitle: "Meera's Room",
      theme: "sage",
      bannerQuote: "Your private room — decorate and organize your way.",
      layoutJson: JSON.stringify(["board", "trackers"]),
      decorItemsJson: JSON.stringify([]),
      updatedAt: now,
    },
    {
      id: "rc_member",
      householdId,
      ownerKey: "mem_member",
      roomTitle: "Rohan's Room",
      theme: "stone",
      bannerQuote: "Your private room — decorate and organize your way.",
      layoutJson: JSON.stringify(["board", "trackers"]),
      decorItemsJson: JSON.stringify([]),
      updatedAt: now,
    },
  ]);

  // Just 1 example tracker
  await db.insert(trackers).values([
    {
      id: "trk_example_driving",
      householdId,
      memberId: "mem_member",
      type: "LIFE_PLAN",
      title: "Example: Driving Lessons Log",
      category: "Driving",
      unit: "hours",
      targetValue: 30,
      currentValue: 2,
      cadence: "MILESTONE",
      visibility: "FAMILY",
      notes: "Sample tracker — click '+ Log hours' or add your own exercise/diet tracker!",
      createdAt: now,
    },
  ]);

  // Clean Shopping & Chores checklists (just 1 example item each)
  await db.insert(householdLists).values([
    {
      id: "list_shopping",
      householdId,
      title: "Shopping List",
      type: "SHOPPING",
      description: "Add groceries and household supplies",
      visibility: "FAMILY",
      createdById: "mem_head",
      createdAt: now,
    },
    {
      id: "list_chores",
      householdId,
      title: "Meal Prep & Chores",
      type: "CHORES",
      description: "Shared home upkeep & meal prep steps",
      visibility: "FAMILY",
      createdById: "mem_head",
      createdAt: now,
    },
  ]);

  await db.insert(listItems).values([
    {
      id: "item_ex_1",
      listId: "list_shopping",
      householdId,
      title: "Example: Fresh Produce & Milk",
      category: "Groceries",
      quantity: "1",
      assigneeId: null,
      dueDate: dateStr(1),
      priority: "MEDIUM",
      isCompleted: false,
      createdById: "mem_head",
      createdAt: now,
    },
  ]);

  await db.insert(auditLogs).values([
    {
      id: "aud_1",
      householdId,
      actorId: "mem_head",
      action: "HOUSEHOLD_CREATED",
      targetType: "HOUSEHOLD",
      summary: "Created The Domus Residence with clean starter setup.",
      createdAt: now,
    },
  ]);

  return true;
}

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"));

if (isDirectExecution) {
  seedIfEmpty()
    .then((seeded) => {
      console.log(
        seeded
          ? "✓ Seeded clean Domus starter database (./data/domus.db)"
          : "• Database already exists — delete ./data/domus.db to reset."
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to seed Domus database:", err);
      process.exit(1);
    });
}
