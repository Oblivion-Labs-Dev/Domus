import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { roomConfigs, roomGuestbook, roomKnocks } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";
import { canEnterRoom } from "@/lib/rbac";

async function assertRoomAccess(
  viewerId: string,
  householdId: string,
  roomOwnerId: string
): Promise<boolean> {
  if (roomOwnerId === viewerId) return true;
  const cfg = await db
    .select({ isPublic: roomConfigs.isPublic })
    .from(roomConfigs)
    .where(
      and(
        eq(roomConfigs.householdId, householdId),
        eq(roomConfigs.ownerKey, roomOwnerId)
      )
    )
    .limit(1);
  if (cfg[0]?.isPublic) return true;
  const knocks = await db
    .select()
    .from(roomKnocks)
    .where(eq(roomKnocks.householdId, householdId));
  return canEnterRoom(viewerId, roomOwnerId, knocks);
}

export async function GET(request: Request) {
  await ensureTables();
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const roomOwnerId = searchParams.get("roomOwnerId") ?? viewer.id;

  const allowed = await assertRoomAccess(
    viewer.id,
    viewer.householdId,
    roomOwnerId
  );
  if (!allowed) {
    return NextResponse.json({ error: "Room is locked" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(roomGuestbook)
    .where(
      and(
        eq(roomGuestbook.householdId, viewer.householdId),
        eq(roomGuestbook.roomOwnerId, roomOwnerId)
      )
    )
    .orderBy(desc(roomGuestbook.createdAt));

  const likes = rows.filter((r) => r.kind === "LIKE");
  const comments = rows.filter((r) => r.kind === "COMMENT");

  return NextResponse.json({
    likesCount: likes.length,
    likedByMe: likes.some((l) => l.authorId === viewer.id),
    likerIds: likes.map((l) => l.authorId),
    comments,
  });
}

export async function POST(request: Request) {
  await ensureTables();
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const roomOwnerId =
    typeof body?.roomOwnerId === "string" ? body.roomOwnerId : "";
  const action = body?.action;

  if (!roomOwnerId) {
    return NextResponse.json(
      { error: "roomOwnerId is required" },
      { status: 400 }
    );
  }

  const allowed = await assertRoomAccess(
    actor.id,
    actor.householdId,
    roomOwnerId
  );
  if (!allowed) {
    return NextResponse.json({ error: "Room is locked" }, { status: 403 });
  }

  const now = new Date().toISOString();

  if (action === "TOGGLE_LIKE") {
    const existing = await db
      .select()
      .from(roomGuestbook)
      .where(
        and(
          eq(roomGuestbook.householdId, actor.householdId),
          eq(roomGuestbook.roomOwnerId, roomOwnerId),
          eq(roomGuestbook.authorId, actor.id),
          eq(roomGuestbook.kind, "LIKE")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(roomGuestbook)
        .where(eq(roomGuestbook.id, existing[0].id));
      return NextResponse.json({ liked: false });
    }

    await db.insert(roomGuestbook).values({
      id: `gb_${crypto.randomUUID().slice(0, 8)}`,
      householdId: actor.householdId,
      roomOwnerId,
      authorId: actor.id,
      kind: "LIKE",
      message: "",
      createdAt: now,
    });
    return NextResponse.json({ liked: true }, { status: 201 });
  }

  if (action === "COMMENT") {
    const message =
      typeof body?.message === "string" ? body.message.trim().slice(0, 280) : "";
    if (!message) {
      return NextResponse.json(
        { error: "Please write a comment." },
        { status: 400 }
      );
    }

    const id = `gb_${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(roomGuestbook).values({
      id,
      householdId: actor.householdId,
      roomOwnerId,
      authorId: actor.id,
      kind: "COMMENT",
      message,
      createdAt: now,
    });
    return NextResponse.json({ id }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(request: Request) {
  await ensureTables();
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Comment id required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(roomGuestbook)
    .where(
      and(
        eq(roomGuestbook.id, id),
        eq(roomGuestbook.householdId, actor.householdId)
      )
    )
    .limit(1);

  const entry = rows[0];
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (entry.authorId !== actor.id && entry.roomOwnerId !== actor.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(roomGuestbook).where(eq(roomGuestbook.id, id));
  return NextResponse.json({ ok: true });
}
