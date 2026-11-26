import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { householdLists, listItems } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, canViewList } from "@/lib/rbac";
import { createListItemSchema, updateListItemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "list:add_item")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createListItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid item payload" },
      { status: 400 }
    );
  }

  const listRows = await db
    .select()
    .from(householdLists)
    .where(
      and(
        eq(householdLists.id, parsed.data.listId),
        eq(householdLists.householdId, actor.householdId)
      )
    )
    .limit(1);

  const list = listRows[0];
  if (!list || !canViewList(list, actor)) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const requestedAssignee = parsed.data.assigneeId ?? null;
  if (
    requestedAssignee &&
    requestedAssignee !== actor.id &&
    !can(actor, "list:assign_others")
  ) {
    return NextResponse.json(
      { error: "Your role cannot assign tasks to other family members." },
      { status: 403 }
    );
  }

  const id = `item_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(listItems).values({
    id,
    listId: list.id,
    householdId: actor.householdId,
    title: parsed.data.title,
    category: parsed.data.category,
    quantity: parsed.data.quantity,
    assigneeId: requestedAssignee,
    dueDate: parsed.data.dueDate,
    priority: parsed.data.priority,
    isCompleted: false,
    createdById: actor.id,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const itemId = typeof body?.id === "string" ? body.id : "";
  if (!itemId) {
    return NextResponse.json({ error: "Item id required" }, { status: 400 });
  }
  const parsed = updateListItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update" },
      { status: 400 }
    );
  }

  // If moving across lists via drag-and-drop, verify target list belongs to household
  if (parsed.data.listId) {
    const targetList = await db
      .select({ id: householdLists.id })
      .from(householdLists)
      .where(
        and(
          eq(householdLists.id, parsed.data.listId),
          eq(householdLists.householdId, actor.householdId)
        )
      )
      .limit(1);
    if (targetList.length === 0) {
      return NextResponse.json(
        { error: "Target list not found" },
        { status: 404 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.listId !== undefined) updates.listId = parsed.data.listId;
  if (parsed.data.isCompleted !== undefined)
    updates.isCompleted = parsed.data.isCompleted;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.dueDate !== undefined) updates.dueDate = parsed.data.dueDate;
  if (parsed.data.priority !== undefined)
    updates.priority = parsed.data.priority;
  if (parsed.data.assigneeId !== undefined)
    updates.assigneeId = parsed.data.assigneeId;

  await db
    .update(listItems)
    .set(updates)
    .where(
      and(eq(listItems.id, itemId), eq(listItems.householdId, actor.householdId))
    );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const listId = searchParams.get("listId");

  // Clear all items in a list without deleting the list itself
  if (listId) {
    await db
      .delete(listItems)
      .where(
        and(
          eq(listItems.listId, listId),
          eq(listItems.householdId, actor.householdId)
        )
      );
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Item id or listId required" }, { status: 400 });
  }
  await db
    .delete(listItems)
    .where(
      and(eq(listItems.id, id), eq(listItems.householdId, actor.householdId))
    );
  return NextResponse.json({ ok: true });
}
