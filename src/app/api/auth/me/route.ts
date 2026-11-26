import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { households, members } from "@/db/schema";
import { seedIfEmpty } from "@/db/seed";
import { getCurrentMember } from "@/lib/auth";
import { parsePermissions } from "@/lib/rbac";

export async function GET() {
  await seedIfEmpty();
  const current = await getCurrentMember();

  const allHouseholds = current
    ? await db
        .select()
        .from(households)
        .where(eq(households.id, current.householdId))
        .limit(1)
    : await db.select().from(households).limit(1);
  const household = allHouseholds[0] ?? null;

  const rosterRows = household
    ? await db
        .select()
        .from(members)
        .where(eq(members.householdId, household.id))
    : [];

  const demoMembers = rosterRows.map((m) => {
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
    };
  });

  return NextResponse.json({
    authenticated: Boolean(current),
    member: current,
    household,
    members: demoMembers,
    demoSwitcherEnabled: process.env.NEXT_PUBLIC_ENABLE_DEMO_SWITCHER !== "false",
  });
}
