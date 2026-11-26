import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardCards, boardColumns, boards, roomKnocks } from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";
import { getCurrentMember } from "@/lib/auth";
import { can, canEnterRoom } from "@/lib/rbac";

export async function GET(request: Request) {
  await seedIfEmpty();
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = (searchParams.get("scope") ?? "COMMON").toUpperCase();
  const ownerId = searchParams.get("ownerId") ?? viewer.id;

  if (scope === "PERSONAL" && ownerId !== viewer.id) {
    const knocks = await db
      .select()
      .from(roomKnocks)
      .where(eq(roomKnocks.householdId, viewer.householdId));
    if (!canEnterRoom(viewer.id, ownerId, knocks)) {
      return NextResponse.json(
        { error: "Door is closed. Knock and wait for permission to visit this room." },
        { status: 403 }
      );
    }
  }

  const boardRows =
    scope === "COMMON"
      ? await db
          .select()
          .from(boards)
          .where(
            and(
              eq(boards.householdId, viewer.householdId),
              eq(boards.scope, "COMMON")
            )
          )
          .limit(1)
      : await db
          .select()
          .from(boards)
          .where(
            and(
              eq(boards.householdId, viewer.householdId),
              eq(boards.scope, "PERSONAL"),
              eq(boards.ownerId, ownerId)
            )
          )
          .limit(1);

  let board = boardRows[0];

  // Auto-create a personal board for newly invited members
  if (!board && scope === "PERSONAL") {
    const now = new Date().toISOString();
    const id = `brd_${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(boards).values({
      id,
      householdId: viewer.householdId,
      scope: "PERSONAL",
      ownerId,
      title: "My Personal Board",
      description: "Organize your own columns, notes & tasks.",
      createdAt: now,
    });
    await db.insert(boardColumns).values([
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: id, householdId: viewer.householdId, title: "To Do", color: "#d4633e", position: 0 },
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: id, householdId: viewer.householdId, title: "Doing", color: "#3b6fa0", position: 1 },
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: id, householdId: viewer.householdId, title: "Done", color: "#4f7c5b", position: 2 },
    ]);
    board = {
      id,
      householdId: viewer.householdId,
      scope: "PERSONAL",
      ownerId,
      title: "My Personal Board",
      description: "Organize your own columns, notes & tasks.",
      createdAt: now,
    };
  }

  if (!board) {
    return NextResponse.json({ board: null, columns: [], cards: [] });
  }

  const [columns, cards] = await Promise.all([
    db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.boardId, board.id))
      .orderBy(asc(boardColumns.position)),
    db
      .select()
      .from(boardCards)
      .where(eq(boardCards.boardId, board.id))
      .orderBy(asc(boardCards.position)),
  ]);

  return NextResponse.json({
    board,
    columns,
    cards: cards.map((c) => ({
      ...c,
      tags: safeParseTags(c.tagsJson),
    })),
  });
}

// Add a new custom column to a board
export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.boardId || !body?.title) {
    return NextResponse.json(
      { error: "boardId and title are required" },
      { status: 400 }
    );
  }

  const bRows = await db
    .select()
    .from(boards)
    .where(
      and(eq(boards.id, body.boardId), eq(boards.householdId, actor.householdId))
    )
    .limit(1);
  const board = bRows[0];
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (board.scope === "PERSONAL" && board.ownerId !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can modify columns in their personal room." },
      { status: 403 }
    );
  }
  if (board.scope === "COMMON" && !can(actor, "list:create_or_delete")) {
    return NextResponse.json(
      { error: "Your role cannot add columns to the Common Board." },
      { status: 403 }
    );
  }

  const existingCols = await db
    .select()
    .from(boardColumns)
    .where(eq(boardColumns.boardId, board.id));

  const id = `col_${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(boardColumns).values({
    id,
    boardId: board.id,
    householdId: actor.householdId,
    title: String(body.title).slice(0, 48),
    color: typeof body.color === "string" ? body.color : "#4f7c5b",
    position: existingCols.length,
  });

  return NextResponse.json({ id }, { status: 201 });
}

function safeParseTags(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}
