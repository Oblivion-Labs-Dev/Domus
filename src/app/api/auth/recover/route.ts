import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { households, members } from "@/db/schema";

/**
 * Recovery helper: lets a member look up their Residence Name & House Key
 * using the email they provided when their profile was created.
 */
export async function POST(request: Request) {
  await ensureTables();
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "Please enter your recovery email." },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.email, email))
    .limit(1);
  const member = rows[0];

  if (!member) {
    return NextResponse.json(
      {
        message:
          "If that email is registered in a Domus residence, ask your Head of Household to re-issue your Room Key.",
      },
      { status: 200 }
    );
  }

  const hhRows = await db
    .select()
    .from(households)
    .where(eq(households.id, member.householdId))
    .limit(1);

  return NextResponse.json({
    found: true,
    memberName: member.name,
    residenceName: hhRows[0]?.name ?? "Your Residence",
    houseKey: hhRows[0]?.houseKey ?? "DOMUS-HOME",
    message: `Found ${member.name} in "${hhRows[0]?.name}" (House Key: ${hhRows[0]?.houseKey}). If you also forgot your Room Key, ask your Head of Household to mint a new one.`,
  });
}
