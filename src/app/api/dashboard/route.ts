import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  calendarEvents,
  householdLists,
  listItems,
  members,
  timeBookings,
  trackers,
} from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import {
  canViewList,
  canViewTracker,
  redactEventForViewer,
} from "@/lib/rbac";
import {
  annotateScheduleOverlaps,
  intervalsOverlap,
  involvesMember,
} from "@/lib/schedule";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rawEvents, rawBookings, rawTrackers, rawLists, rawItems, roster] =
    await Promise.all([
      db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.householdId, viewer.householdId)),
      db
        .select()
        .from(timeBookings)
        .where(eq(timeBookings.householdId, viewer.householdId))
        .orderBy(desc(timeBookings.createdAt)),
      db
        .select()
        .from(trackers)
        .where(eq(trackers.householdId, viewer.householdId)),
      db
        .select()
        .from(householdLists)
        .where(eq(householdLists.householdId, viewer.householdId)),
      db
        .select()
        .from(listItems)
        .where(eq(listItems.householdId, viewer.householdId)),
      db
        .select()
        .from(members)
        .where(eq(members.householdId, viewer.householdId)),
    ]);

  const safeEvents = annotateScheduleOverlaps(
    rawEvents
      .map((e) => redactEventForViewer(e, viewer))
      .filter((e): e is NonNullable<typeof e> => e !== null)
  ).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const nowIso = new Date().toISOString();
  const soonIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const memberAvailability = roster.map((m) => {
    const busyNow = safeEvents.find(
      (evt) =>
        involvesMember(evt, m.id) &&
        intervalsOverlap(evt.startTime, evt.endTime, nowIso, soonIso)
    );
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      title: m.title,
      color: m.color,
      avatarInitials: m.avatarInitials,
      status: busyNow ? "BUSY" : "AVAILABLE",
      currentActivity: busyNow ? busyNow.title : "Open for booking",
    };
  });

  const pendingBookings = rawBookings.filter(
    (b) => b.status === "PENDING" || b.status === "AWAITING_HEAD_APPROVAL"
  );

  const visibleTrackers = rawTrackers.filter((t) => canViewTracker(t, viewer));
  const visibleListIds = new Set(
    rawLists.filter((l) => canViewList(l, viewer)).map((l) => l.id)
  );
  const openItems = rawItems.filter(
    (i) => visibleListIds.has(i.listId) && !i.isCompleted
  );

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayEvents = safeEvents.filter((e) =>
    e.startTime.startsWith(todayPrefix)
  );

  return NextResponse.json({
    memberAvailability,
    todayEvents: todayEvents.length > 0 ? todayEvents : safeEvents.slice(0, 6),
    overlappingCount: safeEvents.filter((e) => e.isFamilyOverlap).length,
    pendingBookings,
    trackers: visibleTrackers,
    openItems: openItems.slice(0, 8),
    stats: {
      totalEvents: safeEvents.length,
      pendingBookingsCount: pendingBookings.length,
      openTasksCount: openItems.length,
      activeTrackersCount: visibleTrackers.length,
    },
  });
}
