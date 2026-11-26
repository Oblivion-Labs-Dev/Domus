import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { trackerLogs, trackers } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { createTrackerLogSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "tracker:create_own")) {
    return NextResponse.json(
      { error: "Guests cannot log wellness tracker entries." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTrackerLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid log entry" },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(trackers)
    .where(
      and(
        eq(trackers.id, parsed.data.trackerId),
        eq(trackers.householdId, actor.householdId)
      )
    )
    .limit(1);

  const tracker = rows[0];
  if (!tracker) {
    return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
  }

  if (
    tracker.memberId !== actor.id &&
    actor.role !== "HEAD" &&
    actor.role !== "CO_HEAD"
  ) {
    return NextResponse.json(
      { error: "You can only log progress on your own trackers (or as Head/Co-Head)." },
      { status: 403 }
    );
  }

  if (tracker.currentValue >= tracker.targetValue) {
    return NextResponse.json(
      { error: "This goal is already 100% complete." },
      { status: 400 }
    );
  }

  const id = `tlog_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const nextValue = Math.min(
    tracker.targetValue,
    Number((tracker.currentValue + parsed.data.value).toFixed(2))
  );

  await db.insert(trackerLogs).values({
    id,
    householdId: actor.householdId,
    trackerId: tracker.id,
    memberId: actor.id,
    date: parsed.data.date,
    value: parsed.data.value,
    note: parsed.data.note,
    createdAt: now,
  });

  await db
    .update(trackers)
    .set({ currentValue: nextValue })
    .where(eq(trackers.id, tracker.id));

  return NextResponse.json({ id, currentValue: nextValue }, { status: 201 });
}
