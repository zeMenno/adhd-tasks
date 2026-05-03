import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const COOKIE_NAME = "adhd_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export type SessionPayload = {
  userId: string;
  householdId: string;
  userName: string;
  expiresAt: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
}

async function signSessionToken(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { household: true },
  });
  if (!user) throw new Error("User not found");

  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE;

  return new SignJWT({
    userId: user.id,
    householdId: user.householdId,
    userName: user.name,
    expiresAt,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

/** Server Components / Server Actions only — not usable from Route Handlers. */
export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions());
}

/** Route Handlers must set the cookie on `NextResponse` (cookies().set is not mutable there). */
export async function setSessionCookieOnResponse(
  response: NextResponse,
  userId: string,
): Promise<void> {
  const token = await signSessionToken(userId);
  response.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/pin");
  return session;
}
