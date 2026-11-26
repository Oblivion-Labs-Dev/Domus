import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { parsePermissions } from "@/lib/rbac";

export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.id, actor.id))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const currentPerms = parsePermissions(existing.permissionsJson) as Record<
    string,
    unknown
  >;

  if (typeof body.avatarId === "string") {
    // Allow preset IDs, local /assets/*.png, or compressed data:image/* uploads (max ~150KB)
    if (body.avatarId.length > 200_000) {
      return NextResponse.json(
        { error: "Image is too large. Please pick a smaller image." },
        { status: 400 }
      );
    }
    currentPerms.avatarId = body.avatarId;
  }

  const updates: Partial<typeof members.$inferInsert> = {
    permissionsJson: JSON.stringify(currentPerms),
  };

  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim().slice(0, 60);
  }
  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim().slice(0, 60);
  }

  await db.update(members).set(updates).where(eq(members.id, actor.id));
  return NextResponse.json({ ok: true, avatarId: currentPerms.avatarId ?? null });
}
