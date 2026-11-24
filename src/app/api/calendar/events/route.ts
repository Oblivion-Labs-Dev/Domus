import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, redactEventForViewer } from "@/lib/rbac";
import { annotateScheduleOverlaps } from "@/lib/schedule";
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
  const participants = Array.from(new Set([actor.id, ...data.participantIds]));
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

  const id = `evt_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(calendarEvents).values({
    id,
    householdId: actor.householdId,
    title: data.title,
    category: data.category,
    ownerId: actor.id,
    participantIdsJson: JSON.stringify(participants),
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
