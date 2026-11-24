import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trackerLogs, trackers } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, canViewTracker } from "@/lib/rbac";
import { createTrackerSchema } from "@/lib/validation";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [allTrackers, allLogs] = await Promise.all([
    db
      .select()
      .from(trackers)
      .where(eq(trackers.householdId, viewer.householdId))
      .orderBy(desc(trackers.createdAt)),
    db
      .select()
      .from(trackerLogs)
      .where(eq(trackerLogs.householdId, viewer.householdId))
      .orderBy(desc(trackerLogs.createdAt)),
  ]);

  const visibleTrackers = allTrackers.filter((t) => canViewTracker(t, viewer));
  const visibleIds = new Set(visibleTrackers.map((t) => t.id));
  const visibleLogs = allLogs.filter((l) => visibleIds.has(l.trackerId));

  return NextResponse.json({
    trackers: visibleTrackers,
    logs: visibleLogs.slice(0, 30),
  });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "tracker:create_own")) {
    return NextResponse.json(
      { error: "Guests cannot create household wellness or life plan trackers." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTrackerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tracker payload" },
      { status: 400 }
    );
  }

  const id = `trk_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(trackers).values({
    id,
    householdId: actor.householdId,
    memberId: actor.id,
    type: parsed.data.type,
    title: parsed.data.title,
    category: parsed.data.category,
    unit: parsed.data.unit,
    targetValue: parsed.data.targetValue,
    currentValue: 0,
    cadence: parsed.data.cadence,
    visibility: parsed.data.visibility,
    notes: parsed.data.notes,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
