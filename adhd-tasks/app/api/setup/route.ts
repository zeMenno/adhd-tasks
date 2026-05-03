import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { households, users } from "@/lib/db/schema";
import { hashPin } from "@/lib/auth/pin";
import { getHousehold } from "@/lib/db/queries/household";
import { z } from "zod";

const SetupSchema = z.object({
  householdName: z.string().min(1).max(100),
  users: z
    .array(
      z.object({
        name: z.string().min(1).max(50),
        avatar: z.string().max(10),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        pin: z.string().regex(/^\d{4}$/),
      })
    )
    .min(1)
    .max(3),
});

export async function POST(request: NextRequest) {
  const existing = await getHousehold();
  if (existing) {
    return NextResponse.json({ error: "Huishouden bestaat al" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = SetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const { householdName, users: userInputs } = parsed.data;

  const [household] = await db
    .insert(households)
    .values({ name: householdName })
    .returning();

  await db.insert(users).values(
    await Promise.all(
      userInputs.map(async (u) => ({
        householdId: household.id,
        name: u.name,
        avatar: u.avatar,
        color: u.color,
        pin: await hashPin(u.pin),
      }))
    )
  );

  return NextResponse.json({ success: true, householdId: household.id });
}
