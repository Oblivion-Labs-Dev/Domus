import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  boardCards,
  boards,
  calendarEvents,
  houseResources,
} from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { findConflictsForResource } from "@/lib/schedule";

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.boardId || !body?.columnId || !body?.title) {
    return NextResponse.json(
      { error: "boardId, columnId, and title are required" },
      { status: 400 }
    );
  }

  const boardRows = await db
    .select()
    .from(boards)
    .where(
      and(eq(boards.id, body.boardId), eq(boards.householdId, actor.householdId))
    )
    .limit(1);
  const board = boardRows[0];
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (board.scope === "PERSONAL" && board.ownerId !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can add cards to their personal room." },
      { status: 403 }
    );
  }

  const dueDate = typeof body.dueDate === "string" ? body.dueDate : "";
  const startTime =
    typeof body.startTime === "string" && body.startTime
      ? body.startTime
      : dueDate
        ? new Date(`${dueDate}T10:00:00`).toISOString()
        : "";
  const endTime =
    typeof body.endTime === "string" && body.endTime
      ? body.endTime
      : dueDate
        ? new Date(`${dueDate}T11:00:00`).toISOString()
        : "";
  const resourceId =
    typeof body.resourceId === "string" && body.resourceId
      ? body.resourceId
      : null;

  // Check House Gear conflict if both a gear resource and time window are provided
  if (resourceId && startTime && endTime) {
    const existingEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.householdId, actor.householdId));

    const blocks = existingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      ownerId: e.ownerId,
      participantIds: [],
      resourceId: e.resourceId,
      startTime: e.startTime,
      endTime: e.endTime,
      isShared: e.isShared,
    }));

    const conflicts = findConflictsForResource(
      blocks,
      resourceId,
      startTime,
      endTime
    );

    if (conflicts.length > 0) {
      const resRow = await db
        .select()
        .from(houseResources)
        .where(eq(houseResources.id, resourceId))
        .limit(1);
      const gearName = resRow[0]?.name ?? "That House Gear";
      return NextResponse.json(
        {
          error: `${gearName} is already booked during that time ("${conflicts[0].title}"). Pick another time slot!`,
        },
        { status: 409 }
      );
    }
  }

  const now = new Date().toISOString();
  const cardId = `crd_${crypto.randomUUID().slice(0, 8)}`;
  const syncToCommon =
    body.syncToCommonCalendar !== undefined
      ? Boolean(body.syncToCommonCalendar)
      : board.scope === "COMMON";

  const assigneeId =
    typeof body.assigneeId === "string" && body.assigneeId
      ? body.assigneeId
      : board.scope === "PERSONAL"
        ? actor.id
        : null;

  let linkedEventId: string | null = null;

  // Auto-sync to Calendar whenever a date/time is set!
  if (startTime && endTime) {
    linkedEventId = `evt_${crypto.randomUUID().slice(0, 8)}`;
    const participants = Array.from(
      new Set([actor.id, ...(assigneeId ? [assigneeId] : [])])
    );
    await db.insert(calendarEvents).values({
      id: linkedEventId,
      householdId: actor.householdId,
      title: String(body.title),
      category: board.scope === "COMMON" ? "CHORE" : "PERSONAL",
      ownerId: assigneeId ?? actor.id,
      participantIdsJson: JSON.stringify(participants),
      resourceId,
      startTime,
      endTime,
      visibility:
        board.scope === "COMMON" || syncToCommon ? "FAMILY" : "PRIVATE",
      isShared: board.scope === "COMMON",
      location: board.scope === "COMMON" ? "Common Board Task" : "Personal Room",
      notes: typeof body.description === "string" ? body.description : "",
      createdAt: now,
    });
  }

  const tags: string[] = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  await db.insert(boardCards).values({
    id: cardId,
    boardId: board.id,
    columnId: String(body.columnId),
    householdId: actor.householdId,
    title: String(body.title).slice(0, 120),
    description: typeof body.description === "string" ? body.description : "",
    cardType: body.cardType === "NOTE" ? "NOTE" : "TASK",
    noteColor: typeof body.noteColor === "string" ? body.noteColor : "cream",
    iconAsset: typeof body.iconAsset === "string" ? body.iconAsset : "",
    tagsJson: JSON.stringify(tags),
    priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(body.priority)
      ? body.priority
      : "MEDIUM",
    assigneeId,
    resourceId,
    dueDate,
    startTime,
    endTime,
    syncToCommonCalendar: syncToCommon,
    linkedEventId,
    position: 0,
    createdById: actor.id,
    createdAt: now,
  });

  return NextResponse.json({ id: cardId, linkedEventId }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cardId = typeof body?.id === "string" ? body.id : "";
  if (!cardId) {
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(boardCards)
    .where(
      and(
        eq(boardCards.id, cardId),
        eq(boardCards.householdId, actor.householdId)
      )
    )
    .limit(1);

  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const boardRows = await db
    .select()
    .from(boards)
    .where(eq(boards.id, card.boardId))
    .limit(1);
  const board = boardRows[0];
  if (board?.scope === "PERSONAL" && board.ownerId !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can edit their personal room items." },
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.columnId === "string" && body.columnId) {
    updates.columnId = body.columnId;
  }
  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim().slice(0, 120);
  }
  if (typeof body.description === "string") {
    updates.description = body.description;
  }
  if (typeof body.dueDate === "string") {
    updates.dueDate = body.dueDate;
  }
  if (typeof body.noteColor === "string") {
    updates.noteColor = body.noteColor;
  }

  await db
    .update(boardCards)
    .set(updates)
    .where(
      and(
        eq(boardCards.id, cardId),
        eq(boardCards.householdId, actor.householdId)
      )
    );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("id");
  if (!cardId) {
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(boardCards)
    .where(
      and(
        eq(boardCards.id, cardId),
        eq(boardCards.householdId, actor.householdId)
      )
    )
    .limit(1);

  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const boardRows = await db
    .select()
    .from(boards)
    .where(eq(boards.id, card.boardId))
    .limit(1);
  const board = boardRows[0];
  if (board?.scope === "PERSONAL" && board.ownerId !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can delete their personal room items." },
      { status: 403 }
    );
  }

  if (card.linkedEventId) {
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, card.linkedEventId),
          eq(calendarEvents.householdId, actor.householdId)
        )
      );
  }

  await db
    .delete(boardCards)
    .where(
      and(
        eq(boardCards.id, cardId),
        eq(boardCards.householdId, actor.householdId)
      )
    );

  return NextResponse.json({ ok: true });
}
