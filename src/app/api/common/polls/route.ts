import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { housePolls } from "@/db/schema";
import { getCurrentMember } from "@/lib/auth";

interface PollOption {
  id: string;
  label: string;
  voterIds: string[];
}

export async function GET() {
  const viewer = await getCurrentMember();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(housePolls)
    .where(eq(housePolls.householdId, viewer.householdId))
    .orderBy(desc(housePolls.createdAt));

  return NextResponse.json({
    polls: rows.map((p) => ({
      id: p.id,
      question: p.question,
      tag: p.tag,
      options: safeParseOptions(p.optionsJson),
      createdById: p.createdById,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const question = String(body?.question ?? "").trim();
  const rawOptions: string[] = Array.isArray(body?.options)
    ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
    : [];

  if (!question || rawOptions.length < 2) {
    return NextResponse.json(
      { error: "Provide a question and at least 2 options." },
      { status: 400 }
    );
  }

  const options: PollOption[] = rawOptions.slice(0, 6).map((label, idx) => ({
    id: `opt_${idx}_${crypto.randomUUID().slice(0, 4)}`,
    label,
    voterIds: [],
  }));

  const id = `poll_${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(housePolls).values({
    id,
    householdId: actor.householdId,
    question: question.slice(0, 140),
    tag: typeof body?.tag === "string" ? body.tag : "home",
    optionsJson: JSON.stringify(options),
    createdById: actor.id,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getCurrentMember();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pollId = String(body?.pollId ?? "");
  const optionId = String(body?.optionId ?? "");

  const rows = await db
    .select()
    .from(housePolls)
    .where(
      and(
        eq(housePolls.id, pollId),
        eq(housePolls.householdId, actor.householdId)
      )
    )
    .limit(1);

  const poll = rows[0];
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  const options = safeParseOptions(poll.optionsJson).map((opt) => {
    const withoutMe = opt.voterIds.filter((id) => id !== actor.id);
    if (opt.id === optionId) {
      const alreadyVoted = opt.voterIds.includes(actor.id);
      return {
        ...opt,
        voterIds: alreadyVoted ? withoutMe : [...withoutMe, actor.id],
      };
    }
    return { ...opt, voterIds: withoutMe };
  });

  await db
    .update(housePolls)
    .set({ optionsJson: JSON.stringify(options) })
    .where(eq(housePolls.id, pollId));

  return NextResponse.json({ ok: true, options });
}

function safeParseOptions(raw: string): PollOption[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
