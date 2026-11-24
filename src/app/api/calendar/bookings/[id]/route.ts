import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, calendarEvents, timeBookings } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { respondBookingSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = respondBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(timeBookings)
    .where(
      and(
        eq(timeBookings.id, id),
        eq(timeBookings.householdId, actor.householdId)
      )
    )
    .limit(1);

  const booking = rows[0];
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const action = parsed.data.action;
  const now = new Date().toISOString();

  if (action === "CANCEL") {
    if (booking.requesterId !== actor.id && !can(actor, "booking:approve_others")) {
      return NextResponse.json(
        { error: "Only the requester or Head/Co-Head can cancel this booking." },
        { status: 403 }
      );
    }
    await db
      .update(timeBookings)
      .set({ status: "CANCELLED" })
      .where(eq(timeBookings.id, id));
    return NextResponse.json({ status: "CANCELLED" });
  }

  if (action === "APPROVE") {
    if (!can(actor, "booking:approve_others")) {
      return NextResponse.json(
        { error: "Only Head or Co-Head can approve Junior booking requests." },
        { status: 403 }
      );
    }
    const nextStatus =
      booking.targetMemberId === actor.id ? "ACCEPTED" : "PENDING";

    let createdEventId: string | null = null;
    if (nextStatus === "ACCEPTED") {
      createdEventId = `evt_${crypto.randomUUID().slice(0, 8)}`;
      await db.insert(calendarEvents).values({
        id: createdEventId,
        householdId: actor.householdId,
        title: booking.title,
        category: booking.category || "BOOKING",
        ownerId: booking.requesterId,
        participantIdsJson: JSON.stringify([
          booking.requesterId,
          booking.targetMemberId,
        ]),
        startTime: booking.startTime,
        endTime: booking.endTime,
        visibility: "FAMILY",
        isShared: true,
        location: "Booked via Domus",
        notes: booking.notes ?? "",
        createdAt: now,
      });
    }

    await db
      .update(timeBookings)
      .set({ status: nextStatus, approvedById: actor.id, createdEventId })
      .where(eq(timeBookings.id, id));

    await db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      householdId: actor.householdId,
      actorId: actor.id,
      action: "BOOKING_APPROVED",
      targetType: "BOOKING",
      summary: `${actor.name} approved time-booking "${booking.title}".`,
      createdAt: now,
    });

    return NextResponse.json({ status: nextStatus, createdEventId });
  }

  // ACCEPT or DECLINE
  const canAct =
    booking.targetMemberId === actor.id || can(actor, "booking:approve_others");
  if (!canAct) {
    return NextResponse.json(
      { error: "Only the requested member or Head/Co-Head can respond." },
      { status: 403 }
    );
  }

  if (
    booking.status === "AWAITING_HEAD_APPROVAL" &&
    !can(actor, "booking:approve_others")
  ) {
    return NextResponse.json(
      {
        error:
          "This Junior request requires Head or Co-Head approval before it can be finalized.",
      },
      { status: 403 }
    );
  }

  if (action === "DECLINE") {
    await db
      .update(timeBookings)
      .set({ status: "DECLINED", approvedById: actor.id })
      .where(eq(timeBookings.id, id));
    return NextResponse.json({ status: "DECLINED" });
  }

  // ACCEPT -> promote to shared calendar event
  const createdEventId = `evt_${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(calendarEvents).values({
    id: createdEventId,
    householdId: actor.householdId,
    title: booking.title,
    category: booking.category || "BOOKING",
    ownerId: booking.requesterId,
    participantIdsJson: JSON.stringify([
      booking.requesterId,
      booking.targetMemberId,
    ]),
    startTime: booking.startTime,
    endTime: booking.endTime,
    visibility: "FAMILY",
    isShared: true,
    location: "Booked via Domus",
    notes: booking.notes ?? "",
    createdAt: now,
  });

  await db
    .update(timeBookings)
    .set({ status: "ACCEPTED", approvedById: actor.id, createdEventId })
    .where(eq(timeBookings.id, id));

  return NextResponse.json({ status: "ACCEPTED", createdEventId });
}
