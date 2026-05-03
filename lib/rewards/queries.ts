import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rewards } from "@/lib/db/schema";

/**
 * All rewards for a household, newest first. Used for the shop (filter
 * `isActive` in the UI) and for the manage section (full list).
 */
export async function getHouseholdRewards(householdId: string) {
  return db.query.rewards.findMany({
    where: eq(rewards.householdId, householdId),
    orderBy: (r, { desc }) => desc(r.createdAt),
  });
}
