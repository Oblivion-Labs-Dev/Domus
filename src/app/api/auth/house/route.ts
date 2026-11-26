import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import {
  boardColumns,
  boards,
  households,
  members,
  roomConfigs,
} from "@/db/schema";
import { getCurrentMember, hashPassword, setSessionCookie } from "@/lib/auth";
import { generateRoomKey, getAvatarPreset } from "@/lib/avatars";

async function mintUniqueHouseKey(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Math.floor(1000 + Math.random() * 9000);
    const candidate = `DOMUS-${code}`;
    const existing = await db
      .select({ id: households.id })
      .from(households)
      .where(eq(households.houseKey, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
  }
  return `DOMUS-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => null);
  if (!body || !body.mode) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // CREATE A BRAND NEW HOUSE (User becomes Head of Household!)
  // Automatically mints BOTH the House Key and the Head's personal Room Key.
  if (body.mode === "CREATE") {
    const residenceName = String(body.residenceName ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const avatarId = String(body.avatarId ?? "crown");

    if (!residenceName || !name || !email) {
      return NextResponse.json(
        {
          error:
            "Please provide a residence name, your name, and a recovery email.",
        },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(members)
      .where(eq(members.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const householdId = `hh_${crypto.randomUUID().slice(0, 8)}`;
    const houseKey = await mintUniqueHouseKey();
    const roomKey = generateRoomKey();
    const memberId = `mem_${crypto.randomUUID().slice(0, 8)}`;
    const preset = getAvatarPreset(avatarId);
    const initials = name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    await db.insert(households).values({
      id: householdId,
      name: residenceName.slice(0, 64),
      houseKey,
      timezone: "America/Los_Angeles",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      createdAt: now,
    });

    await db.insert(members).values({
      id: memberId,
      householdId,
      name: name.slice(0, 60),
      email,
      passwordHash: hashPassword(roomKey),
      role: "HEAD",
      title: "Head of Household",
      color: preset?.ring ?? "#d45a33",
      avatarInitials: initials || "HD",
      permissionsJson: JSON.stringify({
        avatarId,
        canApproveBookings: true,
        canManageLists: true,
        canViewAllHealth: true,
        canBookWithoutApproval: true,
      }),
      createdAt: now,
    });

    // Starter Common Board & Personal Board + 2 starter House Gear items
    const commonBoardId = `brd_${crypto.randomUUID().slice(0, 8)}`;
    const personalBoardId = `brd_${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(boards).values([
      {
        id: commonBoardId,
        householdId,
        scope: "COMMON",
        ownerId: null,
        title: `${residenceName} Common Board`,
        description: "Shared tasks, sticky notes, and house plans.",
        createdAt: now,
      },
      {
        id: personalBoardId,
        householdId,
        scope: "PERSONAL",
        ownerId: memberId,
        title: `${name}'s Personal Board`,
        description: "Your flexible private space.",
        createdAt: now,
      },
    ]);

    await db.insert(boardColumns).values([
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: commonBoardId, householdId, title: "Open / Unclaimed", color: "#d45a33", position: 0 },
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: commonBoardId, householdId, title: "Picked Up", color: "#365578", position: 1 },
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: commonBoardId, householdId, title: "Done", color: "#3b6e52", position: 2 },
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: personalBoardId, householdId, title: "To Do", color: "#d45a33", position: 0 },
      { id: `col_${crypto.randomUUID().slice(0, 6)}`, boardId: personalBoardId, householdId, title: "Done", color: "#3b6e52", position: 1 },
    ]);

    await db.insert(roomConfigs).values([
      {
        id: `rc_${crypto.randomUUID().slice(0, 8)}`,
        householdId,
        ownerKey: "COMMON",
        roomTitle: residenceName,
        theme: "stone",
        bannerQuote: "Welcome to our digital home!",
        isPublic: true,
        layoutJson: JSON.stringify(["board"]),
        decorItemsJson: JSON.stringify([]),
        updatedAt: now,
      },
      {
        id: `rc_${crypto.randomUUID().slice(0, 8)}`,
        householdId,
        ownerKey: memberId,
        roomTitle: `${name}'s Room`,
        theme: "stone",
        bannerQuote: "Customize & place 2.5D decor anywhere!",
        isPublic: false,
        layoutJson: JSON.stringify(["board", "trackers"]),
        decorItemsJson: JSON.stringify([]),
        updatedAt: now,
      },
    ]);

    await setSessionCookie(memberId);
    return NextResponse.json(
      {
        householdId,
        residenceName: residenceName.slice(0, 64),
        houseKey,
        roomKey,
        memberId,
      },
      { status: 201 }
    );
  }

  // JOIN AN EXISTING HOUSE WITH HOUSE KEY
  if (body.mode === "JOIN") {
    const houseKey = String(body.houseKey ?? "").trim().toUpperCase();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const roomKey = String(body.roomKey ?? "").trim();
    const avatarId = String(body.avatarId ?? "fox");

    if (!houseKey || !name || !email || roomKey.length < 4) {
      return NextResponse.json(
        {
          error:
            "Enter the House Key, your name, email, and a Room Key (4+ chars).",
        },
        { status: 400 }
      );
    }

    const hhRows = await db
      .select()
      .from(households)
      .where(eq(households.houseKey, houseKey))
      .limit(1);
    const household = hhRows[0];
    if (!household) {
      return NextResponse.json(
        { error: `No residence found with House Key "${houseKey}".` },
        { status: 404 }
      );
    }

    const existing = await db
      .select()
      .from(members)
      .where(eq(members.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    const memberId = `mem_${crypto.randomUUID().slice(0, 8)}`;
    const preset = getAvatarPreset(avatarId);
    const initials = name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    await db.insert(members).values({
      id: memberId,
      householdId: household.id,
      name: name.slice(0, 60),
      email,
      passwordHash: hashPassword(roomKey),
      role: "MEMBER",
      title: "Family Member",
      color: preset?.ring ?? "#3b6e52",
      avatarInitials: initials || "FM",
      permissionsJson: JSON.stringify({ avatarId }),
      createdAt: now,
    });

    await setSessionCookie(memberId);
    return NextResponse.json(
      { householdId: household.id, memberId },
      { status: 201 }
    );
  }

  return NextResponse.json({ error: "Unsupported mode" }, { status: 400 });
}

// Head of Household can rename the Residence anytime!
export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (actor.role !== "HEAD") {
    return NextResponse.json(
      { error: "Only the Head of Household can rename the residence." },
      { status: 403 }
    );
  }
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  await db
    .update(households)
    .set({ name: name.slice(0, 64) })
    .where(eq(households.id, actor.householdId));
  return NextResponse.json({ ok: true, name });
}
