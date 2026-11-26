import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardCards, boards, roomConfigs, roomKnocks, trackers } from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";
import { getCurrentMember } from "@/lib/auth";
import { canEnterRoom } from "@/lib/rbac";

export async function GET(request: Request) {
  await seedIfEmpty();
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ownerKey = searchParams.get("ownerKey") ?? viewer.id;

  if (ownerKey !== "COMMON" && ownerKey !== viewer.id) {
    const knocks = await db
      .select()
      .from(roomKnocks)
      .where(eq(roomKnocks.householdId, viewer.householdId));

    if (!canEnterRoom(viewer.id, ownerKey, knocks)) {
      return NextResponse.json(
        {
          locked: true,
          error:
            "This room is private. Knock on the door with a message to request a visit.",
        },
        { status: 403 }
      );
    }
  }

  const cfgRows = await db
    .select()
    .from(roomConfigs)
    .where(
      and(
        eq(roomConfigs.householdId, viewer.householdId),
        eq(roomConfigs.ownerKey, ownerKey)
      )
    )
    .limit(1);

  let config = cfgRows[0];
  if (!config) {
    const now = new Date().toISOString();
    const id = `rc_${crypto.randomUUID().slice(0, 8)}`;
    const defaults = {
      id,
      householdId: viewer.householdId,
      ownerKey,
      roomTitle:
        ownerKey === "COMMON" ? "The Common Living Room" : "My Personal Room",
      theme: "stone",
      bannerQuote: "Arrange your boards, notes & decor however you like.",
      layoutJson: JSON.stringify(["board", "trackers"]),
      decorItemsJson: JSON.stringify([
        { uid: "d_init", assetId: "decor-plant", label: "Desk Plant" },
      ]),
      updatedAt: now,
    };
    await db.insert(roomConfigs).values(defaults);
    config = defaults;
  }

  // Also fetch claimed tasks from the Common Board for personal rooms
  let claimedCommonTasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    priority: string;
    noteColor: string;
    resourceId: string | null;
  }> = [];

  let roomTrackers: Array<typeof trackers.$inferSelect> = [];

  if (ownerKey !== "COMMON") {
    const commonBoards = await db
      .select()
      .from(boards)
      .where(
        and(
          eq(boards.householdId, viewer.householdId),
          eq(boards.scope, "COMMON")
        )
      )
      .limit(1);

    if (commonBoards[0]) {
      const commonCards = await db
        .select()
        .from(boardCards)
        .where(
          and(
            eq(boardCards.boardId, commonBoards[0].id),
            eq(boardCards.assigneeId, ownerKey)
          )
        );
      claimedCommonTasks = commonCards.map((c) => ({
        id: c.id,
        title: c.title,
        dueDate: c.dueDate,
        priority: c.priority,
        noteColor: c.noteColor,
        resourceId: c.resourceId,
      }));
    }

    roomTrackers = await db
      .select()
      .from(trackers)
      .where(
        and(
          eq(trackers.householdId, viewer.householdId),
          eq(trackers.memberId, ownerKey)
        )
      );
  }

  return NextResponse.json({
    config: {
      id: config.id,
      ownerKey: config.ownerKey,
      roomTitle: config.roomTitle,
      theme: config.theme,
      bannerQuote: config.bannerQuote ?? "",
      layout: safeParse(config.layoutJson, ["board", "trackers"]),
      decorItems: safeParse(config.decorItemsJson, []),
    },
    claimedCommonTasks,
    trackers: roomTrackers,
    isOwner: ownerKey === "COMMON" || ownerKey === viewer.id,
  });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ownerKey =
    typeof body?.ownerKey === "string" ? body.ownerKey : actor.id;

  if (ownerKey !== "COMMON" && ownerKey !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can decorate or rearrange their room." },
      { status: 403 }
    );
  }

  const rows = await db
    .select()
    .from(roomConfigs)
    .where(
      and(
        eq(roomConfigs.householdId, actor.householdId),
        eq(roomConfigs.ownerKey, ownerKey)
      )
    )
    .limit(1);

  const now = new Date().toISOString();
  if (!rows[0]) {
    await db.insert(roomConfigs).values({
      id: `rc_${crypto.randomUUID().slice(0, 8)}`,
      householdId: actor.householdId,
      ownerKey,
      roomTitle:
        typeof body.roomTitle === "string"
          ? body.roomTitle
          : ownerKey === "COMMON"
            ? "The Common Living Room"
            : `${actor.name}'s Room`,
      theme: typeof body.theme === "string" ? body.theme : "stone",
      bannerQuote: typeof body.bannerQuote === "string" ? body.bannerQuote : "",
      layoutJson: JSON.stringify(
        Array.isArray(body.layout) ? body.layout : ["board", "trackers"]
      ),
      decorItemsJson: JSON.stringify(
        Array.isArray(body.decorItems) ? body.decorItems : []
      ),
      updatedAt: now,
    });
    return NextResponse.json({ ok: true });
  }

  const updates: Partial<typeof roomConfigs.$inferInsert> = { updatedAt: now };
  if (typeof body.roomTitle === "string") updates.roomTitle = body.roomTitle.slice(0, 80);
  if (typeof body.theme === "string") updates.theme = body.theme;
  if (typeof body.bannerQuote === "string") updates.bannerQuote = body.bannerQuote.slice(0, 160);
  if (Array.isArray(body.layout)) updates.layoutJson = JSON.stringify(body.layout);
  if (Array.isArray(body.decorItems)) updates.decorItemsJson = JSON.stringify(body.decorItems);

  await db
    .update(roomConfigs)
    .set(updates)
    .where(eq(roomConfigs.id, rows[0].id));

  return NextResponse.json({ ok: true });
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
