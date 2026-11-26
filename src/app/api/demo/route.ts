import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import {
  boardCards,
  boardColumns,
  boards,
  calendarEvents,
  fridgeMeals,
  groupWorkouts,
  households,
  housePolls,
  houseResources,
  members,
  roomConfigs,
  trackers,
} from "@/db/schema";
import { hashPassword, setSessionCookie } from "@/lib/auth";

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
 * Dedicated Demo Endpoint (POST /api/demo)
 * Provisions an isolated Demo Residence ("hh_demo_house") with rich example data
 * so visitors can explore Domus without polluting real production households.
 */
export async function POST() {
  await ensureTables();
  const demoHouseId = "hh_demo_house";
  const now = new Date().toISOString();

  const existing = await db
    .select()
    .from(households)
    .where(eq(households.id, demoHouseId))
    .limit(1);

  if (existing.length === 0) {
    const pass = hashPassword("demo123");

    await db.insert(households).values({
      id: demoHouseId,
      name: "Demo Residence",
      houseKey: "DEMO-2026",
      timezone: "America/Los_Angeles",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      createdAt: now,
    });

    await db.insert(members).values([
      {
        id: "demo_head",
        householdId: demoHouseId,
        name: "Aarav",
        email: "aarav@demo.domus",
        passwordHash: pass,
        role: "HEAD",
        title: "Head of Family",
        color: "#d45a33",
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
        id: "demo_cohead",
        householdId: demoHouseId,
        name: "Meera",
        email: "meera@demo.domus",
        passwordHash: pass,
        role: "CO_HEAD",
        title: "Co-Head",
        color: "#3b6e52",
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
        id: "demo_member",
        householdId: demoHouseId,
        name: "Rohan",
        email: "rohan@demo.domus",
        passwordHash: pass,
        role: "MEMBER",
        title: "Family Member",
        color: "#365578",
        avatarInitials: "RO",
        permissionsJson: JSON.stringify({ avatarId: "fox" }),
        createdAt: now,
      },
    ]);

    await db.insert(houseResources).values([
      {
        id: "demo_res_car",
        householdId: demoHouseId,
        name: "Family Car",
        category: "VEHICLE",
        iconAsset: "/assets/decor-car.png",
        notes: "Shared SUV for errands & driving practice",
        createdAt: now,
      },
      {
        id: "demo_res_mower",
        householdId: demoHouseId,
        name: "Lawn Mower",
        category: "YARD",
        iconAsset: "/assets/decor-mower.png",
        notes: "Garage shed",
        createdAt: now,
      },
    ]);

    await db.insert(boards).values([
      {
        id: "demo_brd_common",
        householdId: demoHouseId,
        scope: "COMMON",
        ownerId: null,
        title: "Demo Common Board",
        description: "Try dragging cards, picking up tasks, or creating columns.",
        createdAt: now,
      },
      {
        id: "demo_brd_head",
        householdId: demoHouseId,
        scope: "PERSONAL",
        ownerId: "demo_head",
        title: "Aarav's Personal Board",
        description: "Private room board.",
        createdAt: now,
      },
    ]);

    await db.insert(boardColumns).values([
      { id: "demo_col_1", boardId: "demo_brd_common", householdId: demoHouseId, title: "Open / Unclaimed", color: "#d45a33", iconAsset: "/assets/decor-mower.png", position: 0 },
      { id: "demo_col_2", boardId: "demo_brd_common", householdId: demoHouseId, title: "Picked Up", color: "#365578", iconAsset: "/assets/decor-car.png", position: 1 },
      { id: "demo_col_3", boardId: "demo_brd_common", householdId: demoHouseId, title: "Done", color: "#3b6e52", iconAsset: "/assets/decor-plant.png", position: 2 },
      { id: "demo_col_h1", boardId: "demo_brd_head", householdId: demoHouseId, title: "Focus", color: "#d45a33", position: 0 },
      { id: "demo_col_h2", boardId: "demo_brd_head", householdId: demoHouseId, title: "Done", color: "#3b6e52", position: 1 },
    ]);

    await db.insert(boardCards).values([
      {
        id: "demo_crd_1",
        boardId: "demo_brd_common",
        columnId: "demo_col_1",
        householdId: demoHouseId,
        title: "Mow Front & Back Lawn",
        description: "Click Pick Up to claim this into your room & drag it onto the Calendar.",
        cardType: "TASK",
        noteColor: "sage",
        iconAsset: "/assets/decor-mower.png",
        tagsJson: JSON.stringify(["yard", "weekend"]),
        priority: "HIGH",
        assigneeId: null,
        resourceId: "demo_res_mower",
        dueDate: "",
        syncToCommonCalendar: true,
        position: 0,
        createdById: "demo_head",
        createdAt: now,
      },
      {
        id: "demo_crd_2",
        boardId: "demo_brd_common",
        columnId: "demo_col_2",
        householdId: demoHouseId,
        title: "Driving Lesson — Highway Practice",
        description: "Reserves the Family Car automatically.",
        cardType: "TASK",
        noteColor: "sky",
        iconAsset: "/assets/decor-car.png",
        tagsJson: JSON.stringify(["driving"]),
        priority: "MEDIUM",
        assigneeId: "demo_member",
        resourceId: "demo_res_car",
        dueDate: dateStr(0),
        startTime: dayAt(0, 16, 0),
        endTime: dayAt(0, 17, 0),
        syncToCommonCalendar: true,
        position: 0,
        createdById: "demo_member",
        createdAt: now,
      },
    ]);

    await db.insert(calendarEvents).values([
      {
        id: "demo_evt_1",
        householdId: demoHouseId,
        title: "Morning Family Yoga",
        category: "YOGA",
        ownerId: "demo_cohead",
        participantIdsJson: JSON.stringify(["demo_head", "demo_cohead"]),
        startTime: dayAt(0, 8, 0),
        endTime: dayAt(0, 9, 0),
        visibility: "FAMILY",
        isShared: true,
        location: "Living Room",
        notes: "Shared morning flow",
        createdAt: now,
      },
      {
        id: "demo_evt_2",
        householdId: demoHouseId,
        title: "Driving Lesson — Highway Practice",
        category: "DRIVING",
        ownerId: "demo_member",
        participantIdsJson: JSON.stringify(["demo_member", "demo_head"]),
        resourceId: "demo_res_car",
        startTime: dayAt(0, 16, 0),
        endTime: dayAt(0, 17, 0),
        visibility: "FAMILY",
        isShared: true,
        location: "Family Car",
        notes: "",
        createdAt: now,
      },
    ]);

    await db.insert(fridgeMeals).values([
      {
        id: "demo_meal_1",
        householdId: demoHouseId,
        date: dateStr(0),
        mealType: "DINNER",
        dish: "Grilled Paneer Bowls & Quinoa Salad",
        chefId: "demo_cohead",
        notes: "High protein family dinner",
        createdAt: now,
      },
    ]);

    await db.insert(groupWorkouts).values([
      {
        id: "demo_wrk_1",
        householdId: demoHouseId,
        title: "Push Day Together",
        date: dateStr(0),
        exercisesJson: JSON.stringify(["Bench Press", "Overhead Press", "Tricep Dips"]),
        participantIdsJson: JSON.stringify(["demo_head", "demo_member"]),
        completedIdsJson: JSON.stringify(["demo_head"]),
        createdById: "demo_head",
        createdAt: now,
      },
    ]);

    await db.insert(housePolls).values([
      {
        id: "demo_poll_1",
        householdId: demoHouseId,
        question: "What should we cook for Saturday dinner?",
        tag: "meal",
        optionsJson: JSON.stringify([
          { id: "o1", label: "Homemade Tacos", voterIds: ["demo_member"] },
          { id: "o2", label: "Thai Green Curry", voterIds: ["demo_cohead"] },
          { id: "o3", label: "Wood-Fired Pizza", voterIds: [] },
        ]),
        createdById: "demo_cohead",
        createdAt: now,
      },
    ]);

    await db.insert(trackers).values([
      {
        id: "demo_trk_1",
        householdId: demoHouseId,
        memberId: "demo_head",
        type: "EXERCISE",
        title: "Weekly Zone-2 Running",
        category: "Exercise",
        unit: "mins",
        targetValue: 180,
        currentValue: 120,
        cadence: "WEEKLY",
        visibility: "FAMILY",
        notes: "45 mins × 4 days",
        createdAt: now,
      },
    ]);

    await db.insert(roomConfigs).values([
      {
        id: "demo_rc_common",
        householdId: demoHouseId,
        ownerKey: "COMMON",
        roomTitle: "Demo Common Area",
        theme: "stone",
        bannerQuote: "Explore drag-and-drop blocks, Fridge Meals, Group Workouts & Votes.",
        isPublic: true,
        layoutJson: JSON.stringify([
          { id: "blk_social", type: "social", span: 12 },
          { id: "blk_board", type: "board", span: 12 },
          { id: "blk_gear", type: "gear", span: 12 },
        ]),
        decorItemsJson: JSON.stringify([
          { uid: "dd1", assetId: "decor-plant", label: "Monstera", x: 78, y: 12, scale: 1 },
        ]),
        updatedAt: now,
      },
      {
        id: "demo_rc_head",
        householdId: demoHouseId,
        ownerKey: "demo_head",
        roomTitle: "Aarav's Demo Room",
        theme: "terracotta",
        bannerQuote: "Try dragging blocks, uploading an avatar, or opening your door!",
        isPublic: false,
        layoutJson: JSON.stringify([
          { id: "blk_board", type: "board", span: 12 },
          { id: "blk_trackers", type: "trackers", span: 12 },
        ]),
        decorItemsJson: JSON.stringify([
          { uid: "dd2", assetId: "decor-lamp", label: "Lamp", x: 76, y: 18, scale: 1 },
        ]),
        updatedAt: now,
      },
    ]);
  }

  await setSessionCookie("demo_head");
  return NextResponse.json({ ok: true, houseKey: "DEMO-2026" });
}
