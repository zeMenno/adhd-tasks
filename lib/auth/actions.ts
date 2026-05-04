"use server";

import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPin, verifyPin } from "@/lib/auth/pin";

export async function resetPin(currentPin: string, newPin: string): Promise<void> {
  const session = await requireSession();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user) throw new Error("Gebruiker niet gevonden");

  const valid = await verifyPin(currentPin, user.pin);
  if (!valid) throw new Error("Huidige PIN is onjuist");

  if (!/^\d{4}$/.test(newPin)) throw new Error("Nieuwe PIN moet 4 cijfers zijn");

  const newHash = await hashPin(newPin);
  await db.update(users).set({ pin: newHash }).where(eq(users.id, session.userId));
}
