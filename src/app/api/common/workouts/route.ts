import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents, groupWorkouts } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(groupWorkouts)
    .where(eq(groupWorkouts.householdId, viewer.householdId))
    .orderBy(desc(groupWorkouts.date));

  return NextResponse.json({
    workouts: rows.map((w) => ({
      id: w.id,
      title: w.title,
      date: w.date,
      exercises: safeParseArr(w.exercisesJson),
      participantIds: safeParseArr(w.participantIdsJson),
      completedIds: safeParseArr(w.completedIdsJson),
      linkedEventId: w.linkedEventId,
      createdById: w.createdById,
    })),
  });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const date =
    String(body?.date ?? "").trim() || new Date().toISOString().slice(0, 10);
  const exercises: string[] = Array.isArray(body?.exercises)
    ? body.exercises.map((e: unknown) => String(e).trim()).filter(Boolean)
    : [];

  if (!title) {
    return NextResponse.json(
      { error: "Workout title is required (e.g., Push Day)." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const id = `wrk_${crypto.randomUUID().slice(0, 8)}`;
  const eventId = `evt_${crypto.randomUUID().slice(0, 8)}`;

  await db.insert(calendarEvents).values({
    id: eventId,
    householdId: actor.householdId,
    title: `🏋️ Group Workout: ${title}`,
    category: "EXERCISE",
    ownerId: actor.id,
    participantIdsJson: JSON.stringify([actor.id]),
    startTime: new Date(`${date}T17:30:00`).toISOString(),
    endTime: new Date(`${date}T18:30:00`).toISOString(),
    visibility: "FAMILY",
    isShared: true,
    location: "Home Gym / Shared Session",
    notes: exercises.join(" · "),
    createdAt: now,
  });

  await db.insert(groupWorkouts).values({
    id,
    householdId: actor.householdId,
    title: title.slice(0, 100),
    date,
    exercisesJson: JSON.stringify(exercises),
    participantIdsJson: JSON.stringify([actor.id]),
    completedIdsJson: JSON.stringify([]),
    linkedEventId: eventId,
    createdById: actor.id,
    createdAt: now,
  });

  return NextResponse.json({ id, linkedEventId: eventId }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const workoutId = String(body?.workoutId ?? "");
  const action = body?.action; // JOIN_TOGGLE | COMPLETE_TOGGLE

  const rows = await db
    .select()
    .from(groupWorkouts)
    .where(
      and(
        eq(groupWorkouts.id, workoutId),
        eq(groupWorkouts.householdId, actor.householdId)
      )
    )
    .limit(1);

  const w = rows[0];
  if (!w) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  let participants = safeParseArr(w.participantIdsJson);
  let completed = safeParseArr(w.completedIdsJson);

  if (action === "JOIN_TOGGLE") {
    if (participants.includes(actor.id)) {
      participants = participants.filter((id) => id !== actor.id);
      completed = completed.filter((id) => id !== actor.id);
    } else {
      participants = [...participants, actor.id];
    }
    if (w.linkedEventId) {
      await db
        .update(calendarEvents)
        .set({ participantIdsJson: JSON.stringify(participants) })
        .where(eq(calendarEvents.id, w.linkedEventId));
    }
  } else if (action === "COMPLETE_TOGGLE") {
    if (!participants.includes(actor.id)) {
      participants = [...participants, actor.id];
    }
    if (completed.includes(actor.id)) {
      completed = completed.filter((id) => id !== actor.id);
    } else {
      completed = [...completed, actor.id];
    }
  }

  await db
    .update(groupWorkouts)
    .set({
      participantIdsJson: JSON.stringify(participants),
      completedIdsJson: JSON.stringify(completed),
    })
    .where(eq(groupWorkouts.id, workoutId));

  return NextResponse.json({ ok: true, participants, completed });
}

function safeParseArr(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}
