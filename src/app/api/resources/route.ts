import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { calendarEvents, houseResources } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { intervalsOverlap } from "@/lib/schedule";

export async function GET() {
  await ensureTables();
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resources, events] = await Promise.all([
    db
      .select()
      .from(houseResources)
      .where(eq(houseResources.householdId, viewer.householdId)),
    db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.householdId, viewer.householdId)),
  ]);

  const nowIso = new Date().toISOString();
  const soonIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const enriched = resources.map((res) => {
    const activeEvent = events.find(
      (e) =>
        e.resourceId === res.id &&
        intervalsOverlap(e.startTime, e.endTime, nowIso, soonIso)
    );
    const upcomingEvents = events
      .filter(
        (e) =>
          e.resourceId === res.id &&
          new Date(e.endTime).getTime() >= Date.now()
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

    return {
      ...res,
      status: activeEvent ? "IN_USE" : "AVAILABLE",
      currentEventTitle: activeEvent?.title ?? null,
      nextBooking: upcomingEvents[0]
        ? {
            title: upcomingEvents[0].title,
            startTime: upcomingEvents[0].startTime,
            endTime: upcomingEvents[0].endTime,
          }
        : null,
    };
  });

  return NextResponse.json({ resources: enriched });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "list:create_or_delete")) {
    return NextResponse.json(
      { error: "Only adults / Head / Co-Head can add House Gear." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const id = `res_${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(houseResources).values({
    id,
    householdId: actor.householdId,
    name: String(body.name).slice(0, 60),
    category: typeof body.category === "string" ? body.category : "GEAR",
    iconAsset:
      typeof body.iconAsset === "string"
        ? body.iconAsset
        : "/assets/decor-car.png",
    notes: typeof body.notes === "string" ? body.notes : "",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id }, { status: 201 });
}
