import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { households, members } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { parsePermissions } from "@/lib/rbac";

export async function GET() {
  await ensureTables();
  const current = await getCurrentMember();

  // Never leak household roster or members to unauthenticated requests!
  if (!current) {
    return NextResponse.json({
      authenticated: false,
      member: null,
      household: null,
      members: [],
      isDemoHouse: false,
    });
  }

  const [hhRows, rosterRows] = await Promise.all([
    db
      .select()
      .from(households)
      .where(eq(households.id, current.householdId))
      .limit(1),
    db
      .select()
      .from(members)
      .where(eq(members.householdId, current.householdId)),
  ]);

  const household = hhRows[0] ?? null;
  const householdMembers = rosterRows.map((m) => {
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
    authenticated: true,
    member: current,
    household,
    members: householdMembers,
    isDemoHouse: current.householdId === "hh_demo_house",
  });
}
