import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { redactEventForViewer } from "@/lib/rbac";
import { findAvailableSlots } from "@/lib/schedule";

export async function GET(request: Request) {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");
  const dateStr =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const duration = Number(searchParams.get("duration") ?? "60");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId query parameter is required" },
      { status: 400 }
    );
  }

  const rawEvents = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.householdId, viewer.householdId));

  // Include private blocks as busy intervals (redacted) so we never double-book private time
  const blocks = rawEvents
    .map((e) => redactEventForViewer(e, viewer))
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const slots = findAvailableSlots({
    blocks,
    targetMemberId: memberId,
    dateStr,
    durationMinutes: Number.isFinite(duration) && duration >= 15 ? duration : 60,
  });

  return NextResponse.json({ date: dateStr, memberId, slots });
}
