import "server-only";

import { eq } from "drizzle-orm";
import { differenceInCalendarDays, format } from "date-fns";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Updates the user's daily completion streak.
 *
 * Rules:
 *   - lastCompletionDate === today    → no change (already counted today)
 *   - lastCompletionDate === yesterday → streak + 1
 *   - otherwise (gap or first ever)   → reset to 1
 *
 * Always sets `lastCompletionDate` to today.
 *
 * @returns The new streak value after this completion.
 */
export async function updateStreak(userId: string): Promise<number> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new Error("User not found");

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  let nextStreak: number;
  if (user.lastCompletionDate === todayStr) {
    // Already counted today — keep streak as-is, no DB write needed
    return user.currentStreak;
  }

  if (user.lastCompletionDate) {
    const lastDate = new Date(`${user.lastCompletionDate}T00:00:00`);
    const gap = differenceInCalendarDays(today, lastDate);
    nextStreak = gap === 1 ? user.currentStreak + 1 : 1;
  } else {
    nextStreak = 1;
  }

  await db
    .update(users)
    .set({ currentStreak: nextStreak, lastCompletionDate: todayStr })
    .where(eq(users.id, userId));

  return nextStreak;
}
