import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardCards, boards } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";

/**
 * Returns all unscheduled tasks (claimed from Common Board OR on Personal Board)
 * belonging to the current member so they can drag-and-drop or schedule them
 * directly onto the Calendar!
 */
export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [allBoards, allCards] = await Promise.all([
    db
      .select()
      .from(boards)
      .where(eq(boards.householdId, viewer.householdId)),
    db
      .select()
      .from(boardCards)
      .where(
        and(
          eq(boardCards.householdId, viewer.householdId),
          eq(boardCards.assigneeId, viewer.id)
        )
      ),
  ]);

  const boardById = new Map(allBoards.map((b) => [b.id, b]));

  const unscheduled = allCards
    .filter((c) => !c.dueDate || !c.linkedEventId)
    .map((c) => {
      const b = boardById.get(c.boardId);
      return {
        id: c.id,
        title: c.title,
        description: c.description ?? "",
        priority: c.priority,
        noteColor: c.noteColor,
        resourceId: c.resourceId,
        iconAsset: c.iconAsset ?? "",
        sourceScope: b?.scope ?? "COMMON",
      };
    });

  return NextResponse.json({ tasks: unscheduled });
}
