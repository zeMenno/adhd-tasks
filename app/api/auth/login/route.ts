import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPin } from "@/lib/auth/pin";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, pin } = body as { userId: string; pin: string };

  if (!userId || !pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return NextResponse.json({ error: "Verkeerde PIN" }, { status: 401 });
  }

  const valid = await verifyPin(pin, user.pin);
  if (!valid) {
    return NextResponse.json({ error: "Verkeerde PIN" }, { status: 401 });
  }

  await createSession(userId);
  return NextResponse.json({ success: true });
}
