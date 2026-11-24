import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents, timeBookings } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import {
  can,
  redactEventForViewer,
  requiresHeadApprovalForBooking,
} from "@/lib/rbac";
import { findConflictsForMember } from "@/lib/schedule";
import { createBookingSchema } from "@/lib/validation";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(timeBookings)
    .where(eq(timeBookings.householdId, viewer.householdId))
    .orderBy(desc(timeBookings.createdAt));

  return NextResponse.json({ bookings: rows });
}

export async function POST(request: Request) {
  const requester = await getCurrentMember();
  if (!requester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(requester, "booking:create")) {
    return NextResponse.json(
      { error: "Guests cannot book family members' time." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking payload" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.targetMemberId === requester.id) {
    return NextResponse.json(
      { error: "Use Add Event for your own personal calendar blocks." },
      { status: 400 }
    );
  }

  const rawEvents = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.householdId, requester.householdId));

  const safeBlocks = rawEvents
    .map((e) => redactEventForViewer(e, requester))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const conflicts = findConflictsForMember(
    safeBlocks,
    data.targetMemberId,
    data.startTime,
    data.endTime
  );

  const status = requiresHeadApprovalForBooking(requester)
    ? "AWAITING_HEAD_APPROVAL"
    : "PENDING";

  const id = `bk_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(timeBookings).values({
    id,
    householdId: requester.householdId,
    requesterId: requester.id,
    targetMemberId: data.targetMemberId,
    title: data.title,
    category: data.category,
    notes: data.notes,
    startTime: data.startTime,
    endTime: data.endTime,
    status,
    createdAt: now,
  });

  return NextResponse.json(
    {
      id,
      status,
      conflicts,
      warning:
        conflicts.length > 0
          ? `Heads up: ${conflicts.length} overlapping block(s) found on their calendar.`
          : null,
    },
    { status: 201 }
  );
}
