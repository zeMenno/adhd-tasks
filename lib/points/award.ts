import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";
import { updateStreak } from "./streaks";

/**
 * Awards points for completing a task instance.
 *
 * Inserts a transaction row, increments the cached `users.total_points` atomically,
 * and bumps the user's daily streak. This is the single source of truth for
 * task-completion point awards — both `markTaskDoneWithSession` and `approveTask`
 * call into here.
 *
 * No-op for `points <= 0` (caller is responsible for skipping zero-point awards
 * if it wants to avoid a noisy transaction history; this guard keeps things safe).
 */
export async function awardPoints(
  userId: string,
  instanceId: string,
  points: number,
  taskTitle: string
): Promise<void> {
  if (points <= 0) return;

  await db.insert(transactions).values({
    userId,
    taskInstanceId: instanceId,
    points,
    description: `Taak voltooid: ${taskTitle}`,
  });

  await db
    .update(users)
    .set({ totalPoints: sql`total_points + ${points}` })
    .where(eq(users.id, userId));

  await updateStreak(userId);
}
