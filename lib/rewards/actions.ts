"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rewards } from "@/lib/db/schema";
import { spendPoints } from "@/lib/points/actions";

const createRewardSchema = z.object({
  title: z.string().trim().min(1, "Geef de beloning een naam").max(200),
  description: z.string().trim().max(2000).optional(),
  pointsCost: z.number().int().min(1, "Minimaal 1 punt").max(100_000),
});

export async function createReward(data: {
  title: string;
  description?: string;
  pointsCost: number;
}): Promise<void> {
  const session = await requireSession();
  const parsed = createRewardSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ongeldige invoer");
  }

  const { title, description, pointsCost } = parsed.data;

  await db.insert(rewards).values({
    householdId: session.householdId,
    title,
    description: description || null,
    pointsCost,
    isActive: true,
  });

  revalidatePath("/rewards");
}

export async function toggleReward(rewardId: string): Promise<void> {
  const session = await requireSession();

  const reward = await db.query.rewards.findFirst({
    where: eq(rewards.id, rewardId),
  });
  if (!reward) throw new Error("Beloning niet gevonden");
  if (reward.householdId !== session.householdId) {
    throw new Error("Beloning hoort niet bij dit huishouden");
  }

  await db
    .update(rewards)
    .set({ isActive: !reward.isActive })
    .where(eq(rewards.id, rewardId));

  revalidatePath("/rewards");
}

export async function redeemReward(rewardId: string): Promise<void> {
  await requireSession();
  await spendPoints(rewardId);
}
