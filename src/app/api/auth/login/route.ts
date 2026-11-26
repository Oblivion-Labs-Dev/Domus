import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { households, members } from "@/db/schema";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { parsePermissions } from "@/lib/rbac";

/**
 * Production Authentication Endpoint
 * - Enter House: House Name (or House Key) + Your Room Key (Password).
 *   Domus automatically identifies which family member owns that Room Key.
 * - Demo switcher: strictly isolated to the Demo Residence ("hh_demo_house").
 */
export async function POST(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Strictly scoped Demo-House switcher (ONLY works inside the dedicated Demo Residence)
  if (typeof body.demoSwitchMemberId === "string") {
    const rows = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, body.demoSwitchMemberId),
          eq(members.householdId, "hh_demo_house")
        )
      )
      .limit(1);
    const demoMember = rows[0];
    if (!demoMember) {
      return NextResponse.json(
        { error: "Demo role switching is only available inside the Demo House." },
        { status: 403 }
      );
    }
    await setSessionCookie(demoMember.id);
    return NextResponse.json({
      member: {
        id: demoMember.id,
        householdId: demoMember.householdId,
        name: demoMember.name,
        email: demoMember.email,
        role: demoMember.role,
        title: demoMember.title,
        color: demoMember.color,
        avatarInitials: demoMember.avatarInitials,
        permissions: parsePermissions(demoMember.permissionsJson),
      },
    });
  }

  const houseIdentifier = String(body.houseIdentifier ?? "").trim();
  const roomKey = String(body.roomKey ?? body.password ?? "").trim();

  if (!houseIdentifier || !roomKey) {
    return NextResponse.json(
      { error: "Please enter your House Name (or Key) and your Room Key." },
      { status: 400 }
    );
  }

  const allHouses = await db.select().from(households);
  const normalizedHouse = houseIdentifier.toLowerCase();
  const house = allHouses.find(
    (h) =>
      h.houseKey.toLowerCase() === normalizedHouse ||
      h.name.toLowerCase() === normalizedHouse
  );

  if (!house) {
    return NextResponse.json(
      { error: "House not found. Check your House Name or House Key." },
      { status: 401 }
    );
  }

  const houseMembers = await db
    .select()
    .from(members)
    .where(eq(members.householdId, house.id));

  // Automatically identify the member whose Room Key matches!
  const matchedMember = houseMembers.find((m) =>
    verifyPassword(roomKey, m.passwordHash)
  );

  if (!matchedMember) {
    return NextResponse.json(
      { error: "That Room Key doesn't unlock any room in this house." },
      { status: 401 }
    );
  }

  await setSessionCookie(matchedMember.id);
  return NextResponse.json({
    member: {
      id: matchedMember.id,
      householdId: matchedMember.householdId,
      name: matchedMember.name,
      email: matchedMember.email,
      role: matchedMember.role,
      title: matchedMember.title,
      color: matchedMember.color,
      avatarInitials: matchedMember.avatarInitials,
      permissions: parsePermissions(matchedMember.permissionsJson),
    },
  });
}
