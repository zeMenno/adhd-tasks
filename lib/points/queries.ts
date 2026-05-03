import "server-only";

import { and, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { startOfWeek } from "date-fns";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";

/**
 * Live total of all transactions for a user (positive earned + negative spent).
 *
 * This is the source-of-truth value, computed fresh from the transactions table.
 * `users.totalPoints` is a denormalized cache for fast leaderboards;
 * use this function whenever you need an authoritative balance (e.g. before
 * spending points on a reward).
 */
export async function getUserPoints(userId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${transactions.points}), 0)::int`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  return Number(row?.total ?? 0);
}

/**
 * Most recent transactions for a user, joined with the task definition (via
 * the task instance) and the reward (if it was a redemption). Used by the
 * transaction history list (Step 14) and any future stats screens.
 */
export async function getUserTransactions(userId: string, limit = 20) {
  return db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit,
    with: {
      reward: true,
      taskInstance: {
        with: { task: true },
      },
    },
  });
}

export type UserTransactionRow = Awaited<
  ReturnType<typeof getUserTransactions>
>[number];

export type HouseholdLeaderboardRow = {
  userId: string;
  name: string;
  color: string;
  avatar: string | null;
  totalPoints: number;
  /** Sum of positive transactions since this week's Monday (weekStartsOn: 1). */
  weekPoints: number;
};

/**
 * Leaderboard for a household: cached `totalPoints` per user plus the
 * positive points earned since this week's Monday. Sorted by total desc.
 */
export async function getHouseholdLeaderboard(
  householdId: string
): Promise<HouseholdLeaderboardRow[]> {
  const householdUsers = await db.query.users.findMany({
    where: eq(users.householdId, householdId),
  });
  if (householdUsers.length === 0) return [];

  const userIds = householdUsers.map((u) => u.id);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const weekRows = await db
    .select({
      userId: transactions.userId,
      total: sql<number>`COALESCE(SUM(${transactions.points}), 0)::int`,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.userId, userIds),
        gt(transactions.points, 0),
        gte(transactions.createdAt, weekStart)
      )
    )
    .groupBy(transactions.userId);

  const weekMap = new Map(weekRows.map((r) => [r.userId, Number(r.total)]));

  return householdUsers
    .map((u) => ({
      userId: u.id,
      name: u.name,
      color: u.color,
      avatar: u.avatar,
      totalPoints: u.totalPoints,
      weekPoints: weekMap.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}
