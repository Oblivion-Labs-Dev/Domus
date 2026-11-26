import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, households, members } from "@/db/schema";
import { getCurrentMember, hashPassword } from "@/lib/auth";
import { generateRoomKey, getAvatarPreset } from "@/lib/avatars";
import { can, parsePermissions } from "@/lib/rbac";
import { inviteMemberSchema } from "@/lib/validation";

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rosterRows, hhRows] = await Promise.all([
    db
      .select()
      .from(members)
      .where(eq(members.householdId, viewer.householdId)),
    db
      .select()
      .from(households)
      .where(eq(households.id, viewer.householdId))
      .limit(1),
  ]);

  const logs = can(viewer, "family:view_audit_log")
    ? await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.householdId, viewer.householdId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(20)
    : [];

  return NextResponse.json({
    houseKey: `DOMUS-${(hhRows[0]?.id ?? "HOME").slice(-4).toUpperCase()}`,
    members: rosterRows.map((m) => {
      const perms = parsePermissions(m.permissionsJson) as Record<
        string,
        unknown
      >;
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        title: m.title,
        color: m.color,
        avatarInitials: m.avatarInitials,
        avatarId: typeof perms.avatarId === "string" ? perms.avatarId : null,
        permissions: perms,
        createdAt: m.createdAt,
      };
    }),
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
  // Generate a memorable Room Key password automatically if none provided!
  const roomKey =
    typeof body?.password === "string" && body.password.trim().length >= 6
      ? body.password.trim()
      : generateRoomKey();

  const parsed = inviteMemberSchema.safeParse({
    ...body,
    password: roomKey,
  });

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

  const avatarId =
    typeof body?.avatarId === "string" && getAvatarPreset(body.avatarId)
      ? body.avatarId
      : "fox";
  const preset = getAvatarPreset(avatarId);

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
    passwordHash: hashPassword(roomKey),
    role: parsed.data.role,
    title: parsed.data.title,
    color: preset?.ring ?? parsed.data.color,
    avatarInitials: initials || "FM",
    permissionsJson: JSON.stringify({ avatarId }),
    createdAt: now,
  });

  await db.insert(auditLogs).values({
    id: `aud_${crypto.randomUUID().slice(0, 8)}`,
    householdId: actor.householdId,
    actorId: actor.id,
    action: "MEMBER_INVITED",
    targetType: "MEMBER",
    summary: `${actor.name} handed a House Key & Room Key to ${parsed.data.name} (${parsed.data.role}).`,
    createdAt: now,
  });

  const houseKey = `DOMUS-${actor.householdId.slice(-4).toUpperCase()}`;

  return NextResponse.json(
    {
      id,
      houseKey,
      roomKey,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      avatarId,
    },
    { status: 201 }
  );
}
