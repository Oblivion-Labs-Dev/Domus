import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { householdLists, listItems } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, canViewList } from "@/lib/rbac";
import { createListItemSchema } from "@/lib/validation";

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
