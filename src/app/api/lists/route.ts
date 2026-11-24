import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { householdLists, listItems } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, canViewList } from "@/lib/rbac";
import { createListSchema } from "@/lib/validation";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [lists, items] = await Promise.all([
    db
      .select()
      .from(householdLists)
      .where(eq(householdLists.householdId, viewer.householdId)),
    db
      .select()
      .from(listItems)
      .where(eq(listItems.householdId, viewer.householdId))
      .orderBy(desc(listItems.createdAt)),
  ]);

  const visibleLists = lists
    .filter((l) => canViewList(l, viewer))
    .map((list) => ({
      ...list,
      items: items.filter((item) => item.listId === list.id),
    }));

  return NextResponse.json({ lists: visibleLists });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "list:create_or_delete")) {
    return NextResponse.json(
      { error: "Your role does not have permission to create new household lists." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid list payload" },
      { status: 400 }
    );
  }

  const id = `list_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(householdLists).values({
    id,
    householdId: actor.householdId,
    title: parsed.data.title,
    type: parsed.data.type,
    description: parsed.data.description,
    visibility: parsed.data.visibility,
    createdById: actor.id,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
