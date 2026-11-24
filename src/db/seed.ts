import { db, ensureTables } from "./index";
import {
  auditLogs,
  calendarEvents,
  householdLists,
  households,
  listItems,
  members,
  timeBookings,
  trackerLogs,
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

export async function seedIfEmpty(): Promise<boolean> {
  await ensureTables();
  const existing = await db.select({ value: count() }).from(households);
  if ((existing[0]?.value ?? 0) > 0) {
    return false;
  }

  const now = new Date().toISOString();
  const householdId = "hh_suryawanshi";
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
      id: "item_4",
      listId: "list_shopping",
      householdId,
      title: "Avocados & Bananas",
      category: "Produce",
      quantity: "6 each",
      assigneeId: "mem_guest",
      dueDate: dateStr(0),
      priority: "LOW",
      isCompleted: true,
      completedById: "mem_guest",
      completedAt: now,
      createdById: "mem_cohead",
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
      id: "item_6",
      listId: "list_mealprep",
      householdId,
      title: "Wash & portion berries + overnight oats jars",
      category: "Breakfast",
      quantity: "8 jars",
      assigneeId: "mem_member",
      dueDate: dateStr(1),
      priority: "MEDIUM",
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
    {
      id: "item_8",
      listId: "list_chores",
      householdId,
      title: "Unload dishwasher & wipe kitchen island",
      category: "Kitchen",
      quantity: "15 mins",
      assigneeId: "mem_junior",
      dueDate: dateStr(0),
      priority: "HIGH",
      isCompleted: false,
      createdById: "mem_cohead",
      createdAt: now,
    },
    {
      id: "item_9",
      listId: "list_chores",
      householdId,
      title: "Roll recycling & compost bins to curb",
      category: "Outdoor",
      quantity: "5 mins",
      assigneeId: "mem_member",
      dueDate: dateStr(0),
      priority: "MEDIUM",
      isCompleted: true,
      completedById: "mem_member",
      completedAt: now,
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
      summary: "Initialized The Domus Residence with 5 family roles & RBAC policies.",
      createdAt: now,
    },
    {
      id: "aud_2",
      householdId,
      actorId: "mem_head",
      action: "ROLE_ASSIGNED",
      targetType: "MEMBER",
      summary: "Set Meera as Co-Head with booking approval & list management authority.",
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
          ? "✓ Seeded Domus household database (./data/domus.db)"
          : "• Database already seeded — skipped."
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to seed Domus database:", err);
      process.exit(1);
    });
}
