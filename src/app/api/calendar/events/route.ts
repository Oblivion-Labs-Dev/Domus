import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents, houseResources } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, redactEventForViewer } from "@/lib/rbac";
import {
  annotateScheduleOverlaps,
  findConflictsForResource,
} from "@/lib/schedule";
import { createEventSchema } from "@/lib/validation";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawEvents = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.householdId, viewer.householdId));

  const visible = rawEvents
    .map((evt) => redactEventForViewer(evt, viewer))
    .filter((evt): evt is NonNullable<typeof evt> => evt !== null);

  const annotated = annotateScheduleOverlaps(visible).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return NextResponse.json({ events: annotated });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "calendar:create_personal")) {
    return NextResponse.json(
      { error: "Your role does not have permission to create calendar events." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid event payload" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const resourceId =
    typeof body?.resourceId === "string" && body.resourceId
      ? body.resourceId
      : null;

  const participants =
    data.participantIds.length > 0
      ? Array.from(new Set(data.participantIds))
      : [actor.id];
  const wantsShared = data.isShared || participants.length > 1;

  if (wantsShared && !can(actor, "calendar:create_shared")) {
    return NextResponse.json(
      {
        error:
          "Juniors cannot directly schedule shared events. Use 'Book Someone's Time' to send an approval request.",
      },
      { status: 403 }
    );
  }

  // Prevent House Gear double-booking!
  if (resourceId) {
    const existing = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.householdId, actor.householdId));
    const blocks = existing.map((e) => ({
      id: e.id,
      title: e.title,
      ownerId: e.ownerId,
      participantIds: [],
      resourceId: e.resourceId,
      startTime: e.startTime,
      endTime: e.endTime,
      isShared: e.isShared,
    }));
    const conflicts = findConflictsForResource(
      blocks,
      resourceId,
      data.startTime,
      data.endTime
    );
    if (conflicts.length > 0) {
      const resRow = await db
        .select()
        .from(houseResources)
        .where(eq(houseResources.id, resourceId))
        .limit(1);
      const gearName = resRow[0]?.name ?? "That House Gear";
      return NextResponse.json(
        {
          error: `${gearName} is already reserved during this time ("${conflicts[0].title}").`,
        },
        { status: 409 }
      );
    }
  }

  const id = `evt_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(calendarEvents).values({
    id,
    householdId: actor.householdId,
    title: data.title,
    category: data.category,
    ownerId: actor.id,
    participantIdsJson: JSON.stringify(participants),
    resourceId,
    startTime: data.startTime,
    endTime: data.endTime,
    visibility: data.visibility,
    isShared: wantsShared,
    location: data.location,
    notes: data.notes,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Event id required" }, { status: 400 });
  }
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.householdId, actor.householdId)
      )
    )
    .limit(1);
  const ev = rows[0];
  if (!ev) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (
    ev.ownerId !== actor.id &&
    actor.role !== "HEAD" &&
    actor.role !== "CO_HEAD"
  ) {
    return NextResponse.json(
      { error: "Only the event creator or Head of Household can delete this." },
      { status: 403 }
    );
  }
  await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, id),
        eq(calendarEvents.householdId, actor.householdId)
      )
    );
  return NextResponse.json({ ok: true });
}
