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
  roomKnocks,
  timeBookings,
  trackerLogs,
  trackers,
} from "./schema";
import { hashPassword } from "../lib/auth";
import { count, eq } from "drizzle-orm";

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

export async function seedV2IfMissing(householdId: string): Promise<void> {
  const now = new Date().toISOString();

  const existingResources = await db
    .select({ value: count() })
    .from(houseResources);

  if ((existingResources[0]?.value ?? 0) === 0) {
    await db.insert(houseResources).values([
      {
        id: "res_car",
        householdId,
        name: "Family Car (Honda CR-V)",
        category: "VEHICLE",
        iconAsset: "/assets/decor-car.png",
        notes: "Shared SUV for driving lessons, errands & Costco runs",
        createdAt: now,
      },
      {
        id: "res_mower",
        householdId,
        name: "Lawn Mower & Trimmer",
        category: "YARD",
        iconAsset: "/assets/decor-mower.png",
        notes: "Garage shed — check gas level before starting",
        createdAt: now,
      },
      {
        id: "res_yoga",
        householdId,
        name: "Home Gym & Yoga Corner",
        category: "WELLNESS",
        iconAsset: "/assets/decor-yoga.png",
        notes: "Mats, kettlebells & bench in living/garage studio",
        createdAt: now,
      },
      {
        id: "res_kitchen",
        householdId,
        name: "Main Kitchen & Oven",
        category: "KITCHEN",
        iconAsset: "/assets/decor-groceries.png",
        notes: "Batch meal prep & baking blocks",
        createdAt: now,
      },
    ]);

    // Link existing seeded events to House Gear if present
    await db
      .update(calendarEvents)
      .set({ resourceId: "res_car" })
      .where(eq(calendarEvents.id, "evt_driving_lesson"));
    await db
      .update(calendarEvents)
      .set({ resourceId: "res_mower" })
      .where(eq(calendarEvents.id, "evt_lawn_mowing"));
    await db
      .update(calendarEvents)
      .set({ resourceId: "res_yoga" })
      .where(eq(calendarEvents.id, "evt_morning_yoga"));
  }

  const existingBoards = await db.select({ value: count() }).from(boards);
  if ((existingBoards[0]?.value ?? 0) === 0) {
    // 1. Common House Board
    await db.insert(boards).values([
      {
        id: "brd_common",
        householdId,
        scope: "COMMON",
        ownerId: null,
        title: "Living Room House Board",
        description:
          "Shared chores, shopping runs, meal prep & family notes — pick up any task or drag it across columns.",
        createdAt: now,
      },
      {
        id: "brd_head",
        householdId,
        scope: "PERSONAL",
        ownerId: "mem_head",
        title: "Aarav's Desk Board",
        description: "Personal workouts, house maintenance & focus notes",
        createdAt: now,
      },
      {
        id: "brd_cohead",
        householdId,
        scope: "PERSONAL",
        ownerId: "mem_cohead",
        title: "Meera's Studio Board",
        description: "Yoga flow, meal planning & personal routines",
        createdAt: now,
      },
      {
        id: "brd_member",
        householdId,
        scope: "PERSONAL",
        ownerId: "mem_member",
        title: "Rohan's Room Board",
        description: "Driving test prep, strength training & personal projects",
        createdAt: now,
      },
      {
        id: "brd_junior",
        householdId,
        scope: "PERSONAL",
        ownerId: "mem_junior",
        title: "Ananya's Space Board",
        description: "Swim practice, school work & room chores",
        createdAt: now,
      },
      {
        id: "brd_guest",
        householdId,
        scope: "PERSONAL",
        ownerId: "mem_guest",
        title: "Priya Auntie's Corner",
        description: "Visiting notes & favorite family recipes",
        createdAt: now,
      },
    ]);

    await db.insert(boardColumns).values([
      // Common board columns
      {
        id: "col_common_open",
        boardId: "brd_common",
        householdId,
        title: "Open / Unclaimed",
        color: "#d4633e",
        position: 0,
      },
      {
        id: "col_common_picked",
        boardId: "brd_common",
        householdId,
        title: "Picked Up",
        color: "#3b6fa0",
        position: 1,
      },
      {
        id: "col_common_progress",
        boardId: "brd_common",
        householdId,
        title: "In Progress",
        color: "#c08552",
        position: 2,
      },
      {
        id: "col_common_done",
        boardId: "brd_common",
        householdId,
        title: "Done",
        color: "#4f7c5b",
        position: 3,
      },
      // Personal columns for each member
      { id: "col_head_1", boardId: "brd_head", householdId, title: "Focus Today", color: "#d4633e", position: 0 },
      { id: "col_head_2", boardId: "brd_head", householdId, title: "This Week", color: "#4f7c5b", position: 1 },
      { id: "col_head_3", boardId: "brd_head", householdId, title: "Done", color: "#787164", position: 2 },

      { id: "col_cohead_1", boardId: "brd_cohead", householdId, title: "My Priorities", color: "#4f7c5b", position: 0 },
      { id: "col_cohead_2", boardId: "brd_cohead", householdId, title: "Meal & Yoga Ideas", color: "#d4633e", position: 1 },
      { id: "col_cohead_3", boardId: "brd_cohead", householdId, title: "Completed", color: "#787164", position: 2 },

      { id: "col_member_1", boardId: "brd_member", householdId, title: "Up Next", color: "#3b6fa0", position: 0 },
      { id: "col_member_2", boardId: "brd_member", householdId, title: "Driving & Gym", color: "#d4633e", position: 1 },
      { id: "col_member_3", boardId: "brd_member", householdId, title: "Done", color: "#4f7c5b", position: 2 },

      { id: "col_junior_1", boardId: "brd_junior", householdId, title: "To Do", color: "#9b5de5", position: 0 },
      { id: "col_junior_2", boardId: "brd_junior", householdId, title: "Done", color: "#4f7c5b", position: 1 },

      { id: "col_guest_1", boardId: "brd_guest", householdId, title: "Notes", color: "#c08552", position: 0 },
    ]);

    await db.insert(boardCards).values([
      {
        id: "crd_lawn",
        boardId: "brd_common",
        columnId: "col_common_open",
        householdId,
        title: "Mow Front & Back Lawn + Edge Walkway",
        description:
          "Pick this up to claim it! Reserves the Lawn Mower automatically once scheduled.",
        cardType: "TASK",
        noteColor: "sage",
        tagsJson: JSON.stringify(["lawn", "yard", "weekend"]),
        priority: "HIGH",
        assigneeId: null,
        resourceId: "res_mower",
        dueDate: dateStr(2),
        startTime: dayAt(2, 9, 0),
        endTime: dayAt(2, 10, 30),
        syncToCommonCalendar: true,
        linkedEventId: "evt_lawn_mowing",
        position: 0,
        createdById: "mem_head",
        createdAt: now,
      },
      {
        id: "crd_costco",
        boardId: "brd_common",
        columnId: "col_common_open",
        householdId,
        title: "Costco & Trader Joe's Weekly Run",
        description:
          "Organic spinach, Greek yogurt, avocados, berries, paneer & trimmer line.",
        cardType: "TASK",
        noteColor: "butter",
        tagsJson: JSON.stringify(["shopping", "groceries"]),
        priority: "MEDIUM",
        assigneeId: null,
        resourceId: "res_car",
        dueDate: dateStr(1),
        startTime: dayAt(1, 10, 0),
        endTime: dayAt(1, 11, 30),
        syncToCommonCalendar: true,
        linkedEventId: "evt_grocery_run",
        position: 1,
        createdById: "mem_cohead",
        createdAt: now,
      },
      {
        id: "crd_mealprep",
        boardId: "brd_common",
        columnId: "col_common_picked",
        householdId,
        title: "Sunday High-Protein Meal Prep",
        description:
          "Marinate paneer & tofu bowls, chop veggies, prep 8 overnight oats jars.",
        cardType: "TASK",
        noteColor: "terracotta",
        tagsJson: JSON.stringify(["diet", "meal-prep"]),
        priority: "HIGH",
        assigneeId: "mem_cohead",
        resourceId: "res_kitchen",
        dueDate: dateStr(1),
        startTime: dayAt(1, 15, 0),
        endTime: dayAt(1, 16, 30),
        syncToCommonCalendar: true,
        position: 0,
        createdById: "mem_cohead",
        createdAt: now,
      },
      {
        id: "crd_driving_common",
        boardId: "brd_common",
        columnId: "col_common_progress",
        householdId,
        title: "Rohan Driving Lesson — Highway Merge",
        description:
          "45-min loop with Dad in the CR-V. Focus on blind-spot checks & parallel parking.",
        cardType: "TASK",
        noteColor: "sky",
        tagsJson: JSON.stringify(["driving", "milestone"]),
        priority: "HIGH",
        assigneeId: "mem_member",
        resourceId: "res_car",
        dueDate: dateStr(0),
        startTime: dayAt(0, 16, 0),
        endTime: dayAt(0, 17, 15),
        syncToCommonCalendar: true,
        linkedEventId: "evt_driving_lesson",
        position: 0,
        createdById: "mem_member",
        createdAt: now,
      },
      {
        id: "crd_note_welcome",
        boardId: "brd_common",
        columnId: "col_common_done",
        householdId,
        title: "House Note: Fresh Avocados on Counter!",
        description:
          "Priya Auntie picked up ripe avocados & bananas — great for post-yoga smoothies.",
        cardType: "NOTE",
        noteColor: "butter",
        tagsJson: JSON.stringify(["note", "kitchen"]),
        priority: "LOW",
        assigneeId: "mem_guest",
        resourceId: null,
        dueDate: "",
        syncToCommonCalendar: false,
        position: 0,
        createdById: "mem_guest",
        createdAt: now,
      },
      // Personal room starter cards
      {
        id: "crd_p_head_1",
        boardId: "brd_head",
        columnId: "col_head_1",
        householdId,
        title: "Zone-2 45-min Morning Run",
        description: "Keep heart rate under 142 bpm along the creek trail.",
        cardType: "TASK",
        noteColor: "terracotta",
        tagsJson: JSON.stringify(["exercise", "cardio"]),
        priority: "HIGH",
        assigneeId: "mem_head",
        dueDate: dateStr(0),
        syncToCommonCalendar: false,
        position: 0,
        createdById: "mem_head",
        createdAt: now,
      },
      {
        id: "crd_p_head_2",
        boardId: "brd_head",
        columnId: "col_head_2",
        householdId,
        title: "Check Lawn Mower Spark Plug & Oil",
        description: "Quick 10-min tune-up before weekend mowing.",
        cardType: "NOTE",
        noteColor: "butter",
        tagsJson: JSON.stringify(["garage", "home"]),
        priority: "MEDIUM",
        assigneeId: "mem_head",
        dueDate: dateStr(1),
        syncToCommonCalendar: false,
        position: 0,
        createdById: "mem_head",
        createdAt: now,
      },
      {
        id: "crd_p_member_1",
        boardId: "brd_member",
        columnId: "col_member_2",
        householdId,
        title: "DMV Road Test Practice Checklist",
        description:
          "3-point turns, hill parking, highway merge — 11.5 hours left to reach 30h goal!",
        cardType: "NOTE",
        noteColor: "sky",
        tagsJson: JSON.stringify(["driving", "dmv"]),
        priority: "HIGH",
        assigneeId: "mem_member",
        dueDate: dateStr(3),
        syncToCommonCalendar: false,
        position: 0,
        createdById: "mem_member",
        createdAt: now,
      },
      {
        id: "crd_p_cohead_1",
        boardId: "brd_cohead",
        columnId: "col_cohead_1",
        householdId,
        title: "Morning Vinyasa + Breathwork",
        description: "45 mins on the living room mat before breakfast.",
        cardType: "TASK",
        noteColor: "sage",
        tagsJson: JSON.stringify(["yoga", "morning"]),
        priority: "HIGH",
        assigneeId: "mem_cohead",
        dueDate: dateStr(0),
        syncToCommonCalendar: false,
        position: 0,
        createdById: "mem_cohead",
        createdAt: now,
      },
    ]);
  }

  const existingRooms = await db.select({ value: count() }).from(roomConfigs);
  if ((existingRooms[0]?.value ?? 0) === 0) {
    await db.insert(roomConfigs).values([
      {
        id: "rc_common",
        householdId,
        ownerKey: "COMMON",
        roomTitle: "The Common Living Room",
        theme: "stone",
        bannerQuote:
          "Pick up a house task, pin a note, or check what gear is free.",
        layoutJson: JSON.stringify(["board", "gear", "lists"]),
        decorItemsJson: JSON.stringify([
          { uid: "d_c1", assetId: "decor-plant", label: "Living Room Monstera" },
          { uid: "d_c2", assetId: "decor-groceries", label: "Sunday Market" },
          { uid: "d_c3", assetId: "decor-lamp", label: "Warm Corner" },
        ]),
        updatedAt: now,
      },
      {
        id: "rc_head",
        householdId,
        ownerKey: "mem_head",
        roomTitle: "Aarav's Study",
        theme: "terracotta",
        bannerQuote: "Steady rhythms, strong home.",
        layoutJson: JSON.stringify(["board", "trackers"]),
        decorItemsJson: JSON.stringify([
          { uid: "d_h1", assetId: "decor-lamp", label: "Desk Lamp" },
          { uid: "d_h2", assetId: "decor-mower", label: "Yard Gear" },
        ]),
        updatedAt: now,
      },
      {
        id: "rc_cohead",
        householdId,
        ownerKey: "mem_cohead",
        roomTitle: "Meera's Sunlit Studio",
        theme: "sage",
        bannerQuote: "Breathe, nourish, and keep the week light.",
        layoutJson: JSON.stringify(["board", "trackers"]),
        decorItemsJson: JSON.stringify([
          { uid: "d_m1", assetId: "decor-plant", label: "Monstera" },
          { uid: "d_m2", assetId: "decor-yoga", label: "Daily Yoga" },
        ]),
        updatedAt: now,
      },
      {
        id: "rc_member",
        householdId,
        ownerKey: "mem_member",
        roomTitle: "Rohan's Loft",
        theme: "midnight",
        bannerQuote: "30 driving hours & clean lifts.",
        layoutJson: JSON.stringify(["board", "trackers"]),
        decorItemsJson: JSON.stringify([
          { uid: "d_r1", assetId: "decor-car", label: "Road Test Goal" },
          { uid: "d_r2", assetId: "decor-yoga", label: "Gym Gear" },
        ]),
        updatedAt: now,
      },
      {
        id: "rc_junior",
        householdId,
        ownerKey: "mem_junior",
        roomTitle: "Ananya's Corner",
        theme: "butter",
        bannerQuote: "Swim fast, stay hydrated!",
        layoutJson: JSON.stringify(["board", "trackers"]),
        decorItemsJson: JSON.stringify([
          { uid: "d_j1", assetId: "decor-plant", label: "Desk Plant" },
          { uid: "d_j2", assetId: "calendar-3d", label: "Swim Schedule" },
        ]),
        updatedAt: now,
      },
      {
        id: "rc_guest",
        householdId,
        ownerKey: "mem_guest",
        roomTitle: "Priya Auntie's Guest Room",
        theme: "stone",
        bannerQuote: "Happy to help around the house!",
        layoutJson: JSON.stringify(["board"]),
        decorItemsJson: JSON.stringify([
          { uid: "d_g1", assetId: "decor-groceries", label: "Recipe Notes" },
        ]),
        updatedAt: now,
      },
    ]);
  }

  const existingKnocks = await db.select({ value: count() }).from(roomKnocks);
  if ((existingKnocks[0]?.value ?? 0) === 0) {
    await db.insert(roomKnocks).values([
      {
        id: "knk_1",
        householdId,
        visitorId: "mem_cohead",
        roomOwnerId: "mem_head",
        message:
          "Hey Aarav! Mind if I peek at your yard checklist before Saturday?",
        status: "KNOCKING",
        createdAt: now,
      },
      {
        id: "knk_2",
        householdId,
        visitorId: "mem_head",
        roomOwnerId: "mem_member",
        message:
          "Knocking! Wanted to see your driving lesson checklist before our 4 PM practice.",
        status: "KNOCKING",
        createdAt: now,
      },
    ]);
  }
}

export async function seedIfEmpty(): Promise<boolean> {
  await ensureTables();
  const existing = await db.select({ value: count() }).from(households);
  const householdId = "hh_suryawanshi";

  if ((existing[0]?.value ?? 0) > 0) {
    await seedV2IfMissing(householdId);
    return false;
  }

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

  await db.insert(members).values([
    {
      id: "mem_head",
      householdId,
      name: "Aarav",
      email: "aarav@domus.local",
      passwordHash: defaultPass,
      role: "HEAD",
      title: "Dad · Head of Family",
      color: "#d4633e",
      avatarInitials: "AA",
      permissionsJson: JSON.stringify({
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
      title: "Mom · Co-Head",
      color: "#4f7c5b",
      avatarInitials: "ME",
      permissionsJson: JSON.stringify({
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
      title: "Older Son · Member",
      color: "#3b6fa0",
      avatarInitials: "RO",
      permissionsJson: JSON.stringify({}),
      createdAt: now,
    },
    {
      id: "mem_junior",
      householdId,
      name: "Ananya",
      email: "ananya@domus.local",
      passwordHash: defaultPass,
      role: "JUNIOR",
      title: "Daughter · Junior",
      color: "#9b5de5",
      avatarInitials: "AN",
      permissionsJson: JSON.stringify({}),
      createdAt: now,
    },
    {
      id: "mem_guest",
      householdId,
      name: "Priya Auntie",
      email: "priya@domus.local",
      passwordHash: defaultPass,
      role: "GUEST",
      title: "Visiting Aunt · Guest",
      color: "#c08552",
      avatarInitials: "PR",
      permissionsJson: JSON.stringify({}),
      createdAt: now,
    },
  ]);

  await db.insert(calendarEvents).values([
    {
      id: "evt_morning_yoga",
      householdId,
      title: "Morning Vinyasa Yoga",
      category: "YOGA",
      ownerId: "mem_cohead",
      participantIdsJson: JSON.stringify(["mem_cohead", "mem_head"]),
      startTime: dayAt(0, 7, 30),
      endTime: dayAt(0, 8, 30),
      visibility: "FAMILY",
      isShared: true,
      location: "Living Room Mat Area",
      notes: "Shared 45-min flow + stretching",
      createdAt: now,
    },
    {
      id: "evt_driving_lesson",
      householdId,
      title: "Driving Lesson — Highway Merge Practice",
      category: "DRIVING",
      ownerId: "mem_member",
      participantIdsJson: JSON.stringify(["mem_member", "mem_head"]),
      startTime: dayAt(0, 16, 0),
      endTime: dayAt(0, 17, 15),
      visibility: "FAMILY",
      isShared: true,
      location: "Honda CR-V · West Loop",
      notes: "Booked Dad's time for highway lane changes & parallel parking",
      createdAt: now,
    },
    {
      id: "evt_gym_strength",
      householdId,
      title: "Upper Body Strength Training",
      category: "EXERCISE",
      ownerId: "mem_member",
      participantIdsJson: JSON.stringify(["mem_member"]),
      startTime: dayAt(0, 11, 0),
      endTime: dayAt(0, 12, 0),
      visibility: "FAMILY",
      isShared: false,
      location: "Garage Gym",
      notes: "Individual workout plan",
      createdAt: now,
    },
    {
      id: "evt_private_focus",
      householdId,
      title: "Tax Advisor Call & Financial Review",
      category: "PERSONAL",
      ownerId: "mem_head",
      participantIdsJson: JSON.stringify(["mem_head"]),
      startTime: dayAt(0, 13, 0),
      endTime: dayAt(0, 14, 0),
      visibility: "PRIVATE",
      isShared: false,
      location: "Home Office",
      notes: "Shows as Busy to other family members",
      createdAt: now,
    },
    {
      id: "evt_family_dinner",
      householdId,
      title: "Family High-Protein Dinner & Weekly Sync",
      category: "DIET",
      ownerId: "mem_cohead",
      participantIdsJson: JSON.stringify([
        "mem_head",
        "mem_cohead",
        "mem_member",
        "mem_junior",
        "mem_guest",
      ]),
      startTime: dayAt(0, 19, 0),
      endTime: dayAt(0, 20, 15),
      visibility: "FAMILY",
      isShared: true,
      location: "Dining Room",
      notes: "Grilled paneer bowls + quinoa salad",
      createdAt: now,
    },
    {
      id: "evt_grocery_run",
      householdId,
      title: "Costco & Trader Joe's Grocery Run",
      category: "SHOPPING",
      ownerId: "mem_cohead",
      participantIdsJson: JSON.stringify(["mem_cohead", "mem_guest"]),
      startTime: dayAt(1, 10, 0),
      endTime: dayAt(1, 11, 30),
      visibility: "FAMILY",
      isShared: true,
      location: "Costco + Trader Joe's",
      notes: "Use the shared Domus Shopping List",
      createdAt: now,
    },
    {
      id: "evt_lawn_mowing",
      householdId,
      title: "Front & Back Lawn Mowing + Edging",
      category: "CHORE",
      ownerId: "mem_head",
      participantIdsJson: JSON.stringify(["mem_head", "mem_member"]),
      startTime: dayAt(2, 9, 0),
      endTime: dayAt(2, 10, 30),
      visibility: "FAMILY",
      isShared: true,
      location: "Yard",
      notes: "Check mower gas level beforehand",
      createdAt: now,
    },
  ]);

  await db.insert(timeBookings).values([
    {
      id: "bk_meal_prep",
      householdId,
      requesterId: "mem_cohead",
      targetMemberId: "mem_head",
      title: "Sunday Meal Prep Chopping & Marinating",
      category: "DIET",
      notes: "Need 45 mins together to prep veggies & lunches for the week",
      startTime: dayAt(1, 15, 0),
      endTime: dayAt(1, 16, 0),
      status: "PENDING",
      createdAt: now,
    },
    {
      id: "bk_junior_ride",
      householdId,
      requesterId: "mem_junior",
      targetMemberId: "mem_member",
      title: "Ride to Swim Practice + Pickup",
      category: "FAMILY",
      notes: "Coach moved practice 30 mins earlier — can you drop me off?",
      startTime: dayAt(1, 17, 0),
      endTime: dayAt(1, 18, 0),
      status: "AWAITING_HEAD_APPROVAL",
      createdAt: now,
    },
  ]);

  await db.insert(trackers).values([
    {
      id: "trk_yoga",
      householdId,
      memberId: "mem_cohead",
      type: "EXERCISE",
      title: "Morning Yoga Consistency",
      category: "Yoga",
      unit: "sessions",
      targetValue: 5,
      currentValue: 4,
      cadence: "WEEKLY",
      visibility: "FAMILY",
      notes: "30-45 min morning flows before breakfast",
      createdAt: now,
    },
    {
      id: "trk_cardio",
      householdId,
      memberId: "mem_head",
      type: "EXERCISE",
      title: "Weekly Zone-2 Running & Walk",
      category: "Exercise",
      unit: "mins",
      targetValue: 180,
      currentValue: 135,
      cadence: "WEEKLY",
      visibility: "FAMILY",
      notes: "45 mins × 4 days",
      createdAt: now,
    },
    {
      id: "trk_diet_protein",
      householdId,
      memberId: "mem_member",
      type: "DIET",
      title: "Clean Home-Cooked Meals",
      category: "Diet",
      unit: "meals",
      targetValue: 18,
      currentValue: 14,
      cadence: "WEEKLY",
      visibility: "FAMILY",
      notes: "High protein, low sugar, home prepped lunches",
      createdAt: now,
    },
    {
      id: "trk_hydration",
      householdId,
      memberId: "mem_junior",
      type: "DIET",
      title: "Daily Hydration Target",
      category: "Hydration",
      unit: "glasses",
      targetValue: 8,
      currentValue: 6,
      cadence: "DAILY",
      visibility: "FAMILY",
      notes: "2L water every school & swim day",
      createdAt: now,
    },
    {
      id: "trk_driving",
      householdId,
      memberId: "mem_member",
      type: "LIFE_PLAN",
      title: "Driving Lessons Road-Test Log",
      category: "Driving Lessons",
      unit: "hours",
      targetValue: 30,
      currentValue: 18.5,
      cadence: "MILESTONE",
      visibility: "FAMILY",
      notes: "Goal: 30 supervised hours (including 5 night hours) before DMV test",
      createdAt: now,
    },
  ]);

  await db.insert(trackerLogs).values([
    {
      id: "tlog_1",
      householdId,
      trackerId: "trk_yoga",
      memberId: "mem_cohead",
      date: dateStr(0),
      value: 1,
      note: "45 min Vinyasa flow with Aarav",
      createdAt: now,
    },
    {
      id: "tlog_2",
      householdId,
      trackerId: "trk_driving",
      memberId: "mem_member",
      date: dateStr(-1),
      value: 1.5,
      note: "Downtown traffic + parallel parking practice",
      createdAt: now,
    },
    {
      id: "tlog_3",
      householdId,
      trackerId: "trk_cardio",
      memberId: "mem_head",
      date: dateStr(0),
      value: 45,
      note: "Morning neighborhood loop run",
      createdAt: now,
    },
  ]);

  await db.insert(householdLists).values([
    {
      id: "list_shopping",
      householdId,
      title: "Weekly Grocery & Shopping",
      type: "SHOPPING",
      description: "Shared family produce, protein, pantry & household essentials",
      visibility: "FAMILY",
      createdById: "mem_cohead",
      createdAt: now,
    },
    {
      id: "list_mealprep",
      householdId,
      title: "Sunday Meal Prep Plan",
      type: "MEAL_PREP",
      description: "Batch cooking & prep tasks for clean weekday lunches and dinners",
      visibility: "FAMILY",
      createdById: "mem_cohead",
      createdAt: now,
    },
    {
      id: "list_chores",
      householdId,
      title: "Home & Lawn Chores",
      type: "CHORES",
      description: "Lawn mowing, yard care, kitchen reset & home upkeep",
      visibility: "FAMILY",
      createdById: "mem_head",
      createdAt: now,
    },
  ]);

  await db.insert(listItems).values([
    {
      id: "item_1",
      listId: "list_shopping",
      householdId,
      title: "Organic Spinach & Baby Kale",
      category: "Produce",
      quantity: "2 tubs",
      assigneeId: "mem_cohead",
      dueDate: dateStr(1),
      priority: "HIGH",
      isCompleted: false,
      createdById: "mem_cohead",
      createdAt: now,
    },
    {
      id: "item_2",
      listId: "list_shopping",
      householdId,
      title: "Greek Yogurt (Plain, 0% Fat)",
      category: "Dairy",
      quantity: "2 large tubs",
      assigneeId: "mem_cohead",
      dueDate: dateStr(1),
      priority: "MEDIUM",
      isCompleted: false,
      createdById: "mem_member",
      createdAt: now,
    },
    {
      id: "item_3",
      listId: "list_shopping",
      householdId,
      title: "Lawn Trimmer Replacement Line",
      category: "Hardware",
      quantity: "1 spool",
      assigneeId: "mem_head",
      dueDate: dateStr(2),
      priority: "MEDIUM",
      isCompleted: false,
      createdById: "mem_head",
      createdAt: now,
    },
    {
      id: "item_5",
      listId: "list_mealprep",
      householdId,
      title: "Marinate paneer & tofu cubes for Mon–Wed bowls",
      category: "Protein",
      quantity: "2 lbs",
      assigneeId: "mem_cohead",
      dueDate: dateStr(1),
      priority: "HIGH",
      isCompleted: false,
      createdById: "mem_cohead",
      createdAt: now,
    },
    {
      id: "item_7",
      listId: "list_chores",
      householdId,
      title: "Mow front & back lawn + blow walkway clippings",
      category: "Yard",
      quantity: "45 mins",
      assigneeId: "mem_head",
      dueDate: dateStr(2),
      priority: "HIGH",
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
      summary: "Initialized The Domus Residence with 5 family roles & universal room privacy.",
      createdAt: now,
    },
  ]);

  await seedV2IfMissing(householdId);
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
          ? "✓ Seeded Domus household database (./data/domus.db)"
          : "✓ Verified & upgraded Domus v2 tables (./data/domus.db)"
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to seed Domus database:", err);
      process.exit(1);
    });
}
