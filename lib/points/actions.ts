"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { rewards, transactions, users } from "@/lib/db/schema";
import { getUserPoints } from "./queries";

/**
 * Redeems a reward by spending the user's points.
 *
 * - Verifies the reward is active and belongs to the caller's household.
 * - Uses the live transaction sum (`getUserPoints`) as the authoritative balance,
 *   not the cached `users.totalPoints` (which can drift if a manual fix is ever
 *   needed). This matches the "always trust transactions" guidance from the build plan.
 * - Inserts a negative transaction row and decrements the cached `total_points`
 *   atomically so the leaderboard stays in sync.
 *
 * Throws "Niet genoeg punten" when the user can't afford the reward.
 *
 * Server-action foundation for Step 14 (Reward Store) — no UI calls this yet.
 */
export async function spendPoints(rewardId: string): Promise<void> {
  const session = await requireSession();

  const reward = await db.query.rewards.findFirst({
    where: and(eq(rewards.id, rewardId), eq(rewards.isActive, true)),
  });
  if (!reward) throw new Error("Beloning niet gevonden");
  if (reward.householdId !== session.householdId) {
    throw new Error("Beloning hoort niet bij dit huishouden");
  }

  const balance = await getUserPoints(session.userId);
  if (balance < reward.pointsCost) {
    throw new Error("Niet genoeg punten");
  }

  const cost = reward.pointsCost;

  await db.insert(transactions).values({
    userId: session.userId,
    rewardId: reward.id,
    points: -cost,
    description: `Reward ingewisseld: ${reward.title}`,
  });

  await db
    .update(users)
    .set({ totalPoints: sql`total_points - ${cost}` })
    .where(eq(users.id, session.userId));

  revalidatePath("/rewards");
  revalidatePath("/today");
}
