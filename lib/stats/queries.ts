import "server-only";

import { and, eq, gt, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { startOfWeek, subDays, format } from "date-fns";
import { db } from "@/lib/db";
import { transactions, users, taskInstances } from "@/lib/db/schema";

export type UserStatsRow = {
  userId: string;
  name: string;
  color: string;
  avatar: string | null;
  totalPoints: number;
  weekPoints: number;
  currentStreak: number;
  completedLast7: number;
  totalLast7: number;
};

export async function getHouseholdStats(householdId: string): Promise<UserStatsRow[]> {
  const householdUsers = await db.query.users.findMany({
    where: eq(users.householdId, householdId),
    orderBy: (u, { desc }) => desc(u.totalPoints),
  });

  if (householdUsers.length === 0) return [];

  const userIds = householdUsers.map((u) => u.id);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const sevenDaysAgoStr = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [weekRows, instanceRows] = await Promise.all([
    // Points earned this week (from transactions)
    db
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
      .groupBy(transactions.userId),

    // Completion stats for last 7 days (assigned instances only)
    db
      .select({
        userId: taskInstances.assignedUserId,
        total: sql<number>`COUNT(*)::int`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${taskInstances.status} IN ('completed', 'approved'))::int`,
      })
      .from(taskInstances)
      .where(
        and(
          isNotNull(taskInstances.assignedUserId),
          inArray(
            sql<string>`${taskInstances.assignedUserId}`,
            userIds
          ),
          gte(taskInstances.dueDate, sevenDaysAgoStr)
        )
      )
      .groupBy(taskInstances.assignedUserId),
  ]);

  const weekMap = new Map(weekRows.map((r) => [r.userId, Number(r.total)]));
  const instanceMap = new Map(
    instanceRows.map((r) => [
      r.userId as string,
      { total: Number(r.total), completed: Number(r.completed) },
    ])
  );

  return householdUsers.map((u) => ({
    userId: u.id,
    name: u.name,
    color: u.color,
    avatar: u.avatar,
    totalPoints: u.totalPoints,
    weekPoints: weekMap.get(u.id) ?? 0,
    currentStreak: u.currentStreak,
    completedLast7: instanceMap.get(u.id)?.completed ?? 0,
    totalLast7: instanceMap.get(u.id)?.total ?? 0,
  }));
}
