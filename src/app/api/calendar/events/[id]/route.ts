import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { canEditOrDeleteEvent } from "@/lib/rbac";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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

  const event = rows[0];
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!canEditOrDeleteEvent(event, actor)) {
    return NextResponse.json(
      { error: "Only the event owner or Head/Co-Head can delete this event." },
      { status: 403 }
    );
  }

  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  return NextResponse.json({ ok: true });
}
