import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, ensureTables } from "@/db";
import { members } from "@/db/schema";
import { MemberContext, parsePermissions, Role } from "./rbac";

const SESSION_COOKIE = "domus_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const SESSION_SECRET =
  process.env.DOMUS_SESSION_SECRET ?? "domus-local-dev-secret-change-me";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSessionToken(memberId: string): string {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ sub: memberId, iat: now, exp: now + SESSION_TTL_MS })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    if (typeof decoded.sub !== "string") return null;
    if (typeof decoded.exp === "number" && Date.now() > decoded.exp) {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

export async function setSessionCookie(memberId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = signSessionToken(memberId);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentMember(): Promise<MemberContext | null> {
  await ensureTables();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const memberId = verifySessionToken(token);
  if (!memberId) return null;

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    title: row.title,
    color: row.color,
    avatarInitials: row.avatarInitials,
    permissions: parsePermissions(row.permissionsJson),
  };
}
