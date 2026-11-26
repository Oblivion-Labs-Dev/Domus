import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { roomKnocks } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";

export async function GET() {
  await ensureTables();
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allKnocks = await db
    .select()
    .from(roomKnocks)
    .where(eq(roomKnocks.householdId, viewer.householdId))
    .orderBy(desc(roomKnocks.createdAt));

  return NextResponse.json({
    incoming: allKnocks.filter((k) => k.roomOwnerId === viewer.id),
    outgoing: allKnocks.filter((k) => k.visitorId === viewer.id),
  });
}

// Knock on another family member's door with a message!
export async function POST(request: Request) {
  const visitor = await getCurrentMember();
  if (!visitor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const roomOwnerId =
    typeof body?.roomOwnerId === "string" ? body.roomOwnerId : "";
  const message =
    typeof body?.message === "string"
      ? body.message.trim().slice(0, 200)
      : "";

  if (!roomOwnerId || roomOwnerId === visitor.id) {
    return NextResponse.json(
      { error: "Choose another family member's door to knock on." },
      { status: 400 }
    );
  }

  // Replace any prior knock from same visitor to same room
  await db
    .delete(roomKnocks)
    .where(
      and(
        eq(roomKnocks.householdId, visitor.householdId),
        eq(roomKnocks.visitorId, visitor.id),
        eq(roomKnocks.roomOwnerId, roomOwnerId)
      )
    );

  const id = `knk_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await db.insert(roomKnocks).values({
    id,
    householdId: visitor.householdId,
    visitorId: visitor.id,
    roomOwnerId,
    message,
    status: "KNOCKING",
    createdAt: now,
  });

  return NextResponse.json({ id, status: "KNOCKING" }, { status: 201 });
}

// Room owner lets a visitor in, declines, or revokes access
export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const knockId = typeof body?.knockId === "string" ? body.knockId : "";
  const status = body?.status;

  if (!knockId || !["ALLOWED", "DECLINED", "REVOKED"].includes(status)) {
    return NextResponse.json({ error: "Invalid knock response" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(roomKnocks)
    .where(
      and(
        eq(roomKnocks.id, knockId),
        eq(roomKnocks.householdId, actor.householdId)
      )
    )
    .limit(1);

  const knock = rows[0];
  if (!knock) {
    return NextResponse.json({ error: "Knock not found" }, { status: 404 });
  }

  // Only the room owner can open or close their own door!
  if (knock.roomOwnerId !== actor.id) {
    return NextResponse.json(
      { error: "Only the room owner can answer knocks on their door." },
      { status: 403 }
    );
  }

  await db
    .update(roomKnocks)
    .set({ status, respondedAt: new Date().toISOString() })
    .where(eq(roomKnocks.id, knockId));

  return NextResponse.json({ ok: true, status });
}
