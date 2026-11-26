import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { households, members } from "@/db/schema";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { parsePermissions } from "@/lib/rbac";

/**
 * Production Authentication Endpoint
 * Supports:
 * 1. House Name or House Key + Your Name + Room Key (Password)
 * 2. Email + Room Key (Password)
 * Note: Demo role switching is strictly isolated to the Demo Residence (/api/demo).
 */
export async function POST(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Strictly scoped Demo-House switcher (ONLY works inside the dedicated Demo Residence!)
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

  const roomKey = String(body.roomKey ?? body.password ?? "").trim();
  if (!roomKey) {
    return NextResponse.json(
      { error: "Please enter your Room Key." },
      { status: 400 }
    );
  }

  let matchedMember: typeof members.$inferSelect | undefined;

  // Path A: House Name / House Key + Member Name + Room Key
  const houseIdentifier = String(body.houseIdentifier ?? "").trim();
  const memberName = String(body.memberName ?? "").trim();

  if (houseIdentifier && memberName) {
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

    matchedMember = houseMembers.find(
      (m) =>
        m.name.toLowerCase() === memberName.toLowerCase() ||
        m.email.toLowerCase() === memberName.toLowerCase()
    );
  } else if (typeof body.email === "string" && body.email.trim()) {
    // Path B: Direct Email + Room Key
    const rows = await db
      .select()
      .from(members)
      .where(eq(members.email, body.email.trim().toLowerCase()))
      .limit(1);
    matchedMember = rows[0];
  } else {
    return NextResponse.json(
      { error: "Enter your House Name (or Key), your Name, and your Room Key." },
      { status: 400 }
    );
  }

  if (!matchedMember || !verifyPassword(roomKey, matchedMember.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid credentials. Check your House, Name, or Room Key." },
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
