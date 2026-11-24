import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { demoSwitchSchema, loginSchema } from "@/lib/validation";
import { parsePermissions } from "@/lib/rbac";

export async function POST(request: Request) {
  await seedIfEmpty();
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Demo quick-switch path (for testing roles seamlessly in local/demo mode)
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER !== "false";
  if (demoEnabled && "memberId" in body && !("password" in body)) {
    const parsed = demoSwitchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(members)
      .where(eq(members.id, parsed.data.memberId))
      .limit(1);
    const member = rows[0];
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    await setSessionCookie(member.id);
    return NextResponse.json({
      member: {
        id: member.id,
        householdId: member.householdId,
        name: member.name,
        email: member.email,
        role: member.role,
        title: member.title,
        color: member.color,
        avatarInitials: member.avatarInitials,
        permissions: parsePermissions(member.permissionsJson),
      },
    });
  }

  // Standard email + password authentication
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid email and password." },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.email, parsed.data.email.toLowerCase()))
    .limit(1);

  const member = rows[0];
  if (!member || !verifyPassword(parsed.data.password, member.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  await setSessionCookie(member.id);
  return NextResponse.json({
    member: {
      id: member.id,
      householdId: member.householdId,
      name: member.name,
      email: member.email,
      role: member.role,
      title: member.title,
      color: member.color,
      avatarInitials: member.avatarInitials,
      permissions: parsePermissions(member.permissionsJson),
    },
  });
}
