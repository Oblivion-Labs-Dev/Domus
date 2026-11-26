import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents, fridgeMeals, members } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(fridgeMeals)
    .where(eq(fridgeMeals.householdId, viewer.householdId))
    .orderBy(asc(fridgeMeals.date));

  return NextResponse.json({ meals: rows });
}

/**
 * Adds a Fridge Meal Note for a specific day AND automatically adds a
 * #meal tagged event to EVERY household member's calendar!
 */
export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = String(body?.date ?? "").trim();
  const dish = String(body?.dish ?? "").trim();
  const mealType = ["BREAKFAST", "LUNCH", "DINNER"].includes(body?.mealType)
    ? body.mealType
    : "DINNER";
  const notes = typeof body?.notes === "string" ? body.notes : "";
  const chefId =
    typeof body?.chefId === "string" && body.chefId ? body.chefId : actor.id;

  if (!date || !dish) {
    return NextResponse.json(
      { error: "Date and dish name are required." },
      { status: 400 }
    );
  }

  const householdMembers = await db
    .select()
    .from(members)
    .where(eq(members.householdId, actor.householdId));

  const hour =
    mealType === "BREAKFAST" ? 8 : mealType === "LUNCH" ? 13 : 19;
  const startTime = new Date(
    `${date}T${String(hour).padStart(2, "0")}:00:00`
  ).toISOString();
  const endTime = new Date(
    `${date}T${String(hour + 1).padStart(2, "0")}:00:00`
  ).toISOString();

  const now = new Date().toISOString();
  const eventId = `evt_${crypto.randomUUID().slice(0, 8)}`;
  const mealId = `meal_${crypto.randomUUID().slice(0, 8)}`;

  await db.insert(calendarEvents).values({
    id: eventId,
    householdId: actor.householdId,
    title: `🍽️ #meal ${mealType[0] + mealType.slice(1).toLowerCase()}: ${dish}`,
    category: "DIET",
    ownerId: chefId,
    participantIdsJson: JSON.stringify(householdMembers.map((m) => m.id)),
    startTime,
    endTime,
    visibility: "FAMILY",
    isShared: true,
    location: "Kitchen · Fridge Note",
    notes,
    createdAt: now,
  });

  await db.insert(fridgeMeals).values({
    id: mealId,
    householdId: actor.householdId,
    date,
    mealType,
    dish: dish.slice(0, 120),
    chefId,
    notes,
    linkedEventId: eventId,
    createdAt: now,
  });

  return NextResponse.json({ id: mealId, linkedEventId: eventId }, { status: 201 });
}

export async function DELETE(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  const rows = await db
    .select()
    .from(fridgeMeals)
    .where(
      and(eq(fridgeMeals.id, id), eq(fridgeMeals.householdId, actor.householdId))
    )
    .limit(1);
  if (rows[0]?.linkedEventId) {
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.id, rows[0].linkedEventId));
  }
  await db.delete(fridgeMeals).where(eq(fridgeMeals.id, id));
  return NextResponse.json({ ok: true });
}
