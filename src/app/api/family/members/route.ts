import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, members } from "@/db/schema";
import { getCurrentMember, hashPassword } from "@/lib/auth";
import { can, parsePermissions } from "@/lib/rbac";
import { inviteMemberSchema } from "@/lib/validation";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rosterRows = await db
    .select()
    .from(members)
    .where(eq(members.householdId, viewer.householdId));

  const logs = can(viewer, "family:view_audit_log")
    ? await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.householdId, viewer.householdId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(20)
    : [];

  return NextResponse.json({
    members: rosterRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      title: m.title,
      color: m.color,
      avatarInitials: m.avatarInitials,
      permissions: parsePermissions(m.permissionsJson),
      createdAt: m.createdAt,
    })),
    auditLogs: logs,
  });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can(actor, "family:invite_member")) {
    return NextResponse.json(
      { error: "Only Head of Household or Co-Head can invite new members." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid member payload" },
      { status: 400 }
    );
  }

  if (parsed.data.role === "HEAD" && actor.role !== "HEAD") {
    return NextResponse.json(
      { error: "Only the Head of Household can assign the HEAD role." },
      { status: 403 }
    );
  }

  const existing = await db
    .select()
    .from(members)
    .where(eq(members.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A family member with this email already exists." },
      { status: 409 }
    );
  }

  const id = `mem_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const initials = parsed.data.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  await db.insert(members).values({
    id,
    householdId: actor.householdId,
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    passwordHash: hashPassword(parsed.data.password),
    role: parsed.data.role,
    title: parsed.data.title,
    color: parsed.data.color,
    avatarInitials: initials || "FM",
    permissionsJson: JSON.stringify({}),
    createdAt: now,
  });

  await db.insert(auditLogs).values({
    id: `aud_${crypto.randomUUID().slice(0, 8)}`,
    householdId: actor.householdId,
    actorId: actor.id,
    action: "MEMBER_INVITED",
    targetType: "MEMBER",
    summary: `${actor.name} added ${parsed.data.name} (${parsed.data.role}) to the household.`,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}
