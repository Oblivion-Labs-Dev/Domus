import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listItems } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { updateListItemSchema } from "@/lib/validation";

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
  const parsed = updateListItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(listItems)
    .where(
      and(eq(listItems.id, id), eq(listItems.householdId, actor.householdId))
    )
    .limit(1);

  const item = rows[0];
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (
    parsed.data.assigneeId !== undefined &&
    parsed.data.assigneeId !== actor.id &&
    !can(actor, "list:assign_others")
  ) {
    return NextResponse.json(
      { error: "Only adults / Head / Co-Head can reassign tasks to others." },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const updates: Partial<typeof listItems.$inferInsert> = {};

  if (parsed.data.isCompleted !== undefined) {
    updates.isCompleted = parsed.data.isCompleted;
    updates.completedById = parsed.data.isCompleted ? actor.id : null;
    updates.completedAt = parsed.data.isCompleted ? now : null;
  }
  if (parsed.data.assigneeId !== undefined) {
    updates.assigneeId = parsed.data.assigneeId;
  }
  if (parsed.data.priority !== undefined) {
    updates.priority = parsed.data.priority;
  }
  if (parsed.data.title !== undefined) {
    updates.title = parsed.data.title;
  }

  await db.update(listItems).set(updates).where(eq(listItems.id, id));
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
    .from(listItems)
    .where(
      and(eq(listItems.id, id), eq(listItems.householdId, actor.householdId))
    )
    .limit(1);

  const item = rows[0];
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const canDelete =
    item.createdById === actor.id || can(actor, "list:create_or_delete");
  if (!canDelete) {
    return NextResponse.json(
      { error: "You can only delete items you added unless you have list management rights." },
      { status: 403 }
    );
  }

  await db.delete(listItems).where(eq(listItems.id, id));
  return NextResponse.json({ ok: true });
}
