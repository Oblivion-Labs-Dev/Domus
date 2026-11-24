import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, members } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { can, parsePermissions } from "@/lib/rbac";
import { updateMemberSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "family:manage_roles")) {
    return NextResponse.json(
      { error: "Only the Head of Household can modify family roles or permissions." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid member update" },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.householdId, actor.householdId)))
    .limit(1);

  const target = rows[0];
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.id === actor.id && parsed.data.role && parsed.data.role !== "HEAD") {
    return NextResponse.json(
      { error: "Head of Household cannot demote themselves without transferring leadership first." },
      { status: 400 }
    );
  }

  const currentPerms = parsePermissions(target.permissionsJson);
  const nextPerms = parsed.data.permissions
    ? { ...currentPerms, ...parsed.data.permissions }
    : currentPerms;

  const updates: Partial<typeof members.$inferInsert> = {
    permissionsJson: JSON.stringify(nextPerms),
  };
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.title) updates.title = parsed.data.title;

  await db.update(members).set(updates).where(eq(members.id, id));

  await db.insert(auditLogs).values({
    id: `aud_${crypto.randomUUID().slice(0, 8)}`,
    householdId: actor.householdId,
    actorId: actor.id,
    action: "PERMISSIONS_UPDATED",
    targetType: "MEMBER",
    summary: `${actor.name} updated ${target.name}'s role/permissions (${parsed.data.role ?? target.role}).`,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
