import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  boardCards,
  boardColumns,
  boards,
  calendarEvents,
} from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";

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
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(boardCards)
    .where(
      and(eq(boardCards.id, id), eq(boardCards.householdId, actor.householdId))
    )
    .limit(1);
  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const bRows = await db
    .select()
    .from(boards)
    .where(eq(boards.id, card.boardId))
    .limit(1);
  const board = bRows[0];

  if (board?.scope === "PERSONAL" && board.ownerId !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can modify cards in their personal room." },
      { status: 403 }
    );
  }

  const updates: Partial<typeof boardCards.$inferInsert> = {};

  // 1-Click "Pick Up" for Common Board tasks!
  if (body.action === "PICK_UP") {
    updates.assigneeId = actor.id;
    // Automatically move to "Picked Up" column if currently in "Open / Unclaimed"
    const cols = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.boardId, card.boardId));
    const pickedCol = cols.find((c) =>
      c.title.toLowerCase().includes("picked")
    );
    if (pickedCol && card.columnId !== pickedCol.id) {
      updates.columnId = pickedCol.id;
    }

    // If linked to a calendar event, add actor as participant
    if (card.linkedEventId) {
      await db
        .update(calendarEvents)
        .set({
          ownerId: actor.id,
          participantIdsJson: JSON.stringify([actor.id]),
        })
        .where(eq(calendarEvents.id, card.linkedEventId));
    }
  }

  if (typeof body.columnId === "string") updates.columnId = body.columnId;
  if (typeof body.position === "number") updates.position = body.position;
  if (typeof body.title === "string") updates.title = body.title.slice(0, 120);
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.noteColor === "string") updates.noteColor = body.noteColor;
  if (typeof body.priority === "string") updates.priority = body.priority;
  if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId;
  if (body.resourceId !== undefined) updates.resourceId = body.resourceId;
  if (Array.isArray(body.tags)) {
    updates.tagsJson = JSON.stringify(body.tags.map(String));
  }

  // Schedule onto Calendar directly from a card!
  if (typeof body.dueDate === "string" && body.dueDate) {
    const startTime =
      typeof body.startTime === "string" && body.startTime
        ? body.startTime
        : new Date(`${body.dueDate}T10:00:00`).toISOString();
    const endTime =
      typeof body.endTime === "string" && body.endTime
        ? body.endTime
        : new Date(`${body.dueDate}T11:00:00`).toISOString();

    updates.dueDate = body.dueDate;
    updates.startTime = startTime;
    updates.endTime = endTime;

    if (card.linkedEventId) {
      await db
        .update(calendarEvents)
        .set({
          startTime,
          endTime,
          resourceId:
            body.resourceId !== undefined ? body.resourceId : card.resourceId,
        })
        .where(eq(calendarEvents.id, card.linkedEventId));
    } else {
      const evtId = `evt_${crypto.randomUUID().slice(0, 8)}`;
      const ownerId =
        (updates.assigneeId as string | null | undefined) ??
        card.assigneeId ??
        actor.id;
      await db.insert(calendarEvents).values({
        id: evtId,
        householdId: actor.householdId,
        title: (updates.title as string | undefined) ?? card.title,
        category: board?.scope === "COMMON" ? "CHORE" : "PERSONAL",
        ownerId,
        participantIdsJson: JSON.stringify([ownerId]),
        resourceId:
          (updates.resourceId as string | null | undefined) ?? card.resourceId,
        startTime,
        endTime,
        visibility:
          board?.scope === "COMMON" || card.syncToCommonCalendar
            ? "FAMILY"
            : "PRIVATE",
        isShared: board?.scope === "COMMON",
        location: board?.scope === "COMMON" ? "Common Board" : "Personal Room",
        notes: card.description ?? "",
        createdAt: new Date().toISOString(),
      });
      updates.linkedEventId = evtId;
    }
  }

  await db.update(boardCards).set(updates).where(eq(boardCards.id, id));
  return NextResponse.json({ ok: true });
}

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
    .from(boardCards)
    .where(
      and(eq(boardCards.id, id), eq(boardCards.householdId, actor.householdId))
    )
    .limit(1);
  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (card.linkedEventId) {
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.id, card.linkedEventId));
  }
  await db.delete(boardCards).where(eq(boardCards.id, id));
  return NextResponse.json({ ok: true });
}
