import "server-only";
import { format } from "date-fns";
import { and, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { taskInstances, tasks } from "@/lib/db/schema";
import { calculateEarnedPoints } from "@/lib/tasks/recurrence";

export type NotifyInstanceRow = {
  id: string;
  dueDate: string;
  daysOverdue: number;
  basePoints: number;
  penaltyPerDay: number;
};

/**
 * Open instances relevant for push reminders for this user:
 * due today or earlier, not finished, active task in household.
 * Includes rows where instance.assignee is null (household pool) or equals this user.
 */
export async function getOpenInstancesForUserForNotify(
  householdId: string,
  userId: string,
  today: Date
): Promise<NotifyInstanceRow[]> {
  const todayStr = format(today, "yyyy-MM-dd");

  return db
    .select({
      id: taskInstances.id,
      dueDate: taskInstances.dueDate,
      daysOverdue: taskInstances.daysOverdue,
      basePoints: tasks.basePoints,
      penaltyPerDay: tasks.penaltyPerDay,
    })
    .from(taskInstances)
    .innerJoin(tasks, eq(taskInstances.taskId, tasks.id))
    .where(
      and(
        eq(tasks.householdId, householdId),
        eq(tasks.isActive, true),
        inArray(taskInstances.status, ["todo", "done"] as const),
        lte(taskInstances.dueDate, todayStr),
        or(eq(taskInstances.assignedUserId, userId), isNull(taskInstances.assignedUserId))
      )
    );
}

function pointsForfeited(row: NotifyInstanceRow): number {
  const earned = calculateEarnedPoints(
    row.basePoints,
    row.penaltyPerDay,
    row.daysOverdue
  );
  return Math.max(0, row.basePoints - earned);
}

export type NotifyUserMetrics = {
  openCount: number;
  overdueCount: number;
  /** Sum of (basePoints − earnedPoints) for overdue open instances. */
  maxPenalty: number;
  /** Instance id for phase-3 action: most overdue, then highest forfeited, then earliest due. */
  mostOverdueInstanceId: string | undefined;
};

export function summarizeNotifyInstances(rows: NotifyInstanceRow[]): NotifyUserMetrics {
  const openCount = rows.length;
  const overdueRows = rows.filter((r) => r.daysOverdue > 0);
  const overdueCount = overdueRows.length;

  const maxPenalty = overdueRows.reduce((sum, r) => sum + pointsForfeited(r), 0);

  let mostOverdueInstanceId: string | undefined;
  if (overdueRows.length > 0) {
    const sorted = [...overdueRows].sort((a, b) => {
      if (b.daysOverdue !== a.daysOverdue) return b.daysOverdue - a.daysOverdue;
      const fb = pointsForfeited(b);
      const fa = pointsForfeited(a);
      if (fb !== fa) return fb - fa;
      return a.dueDate.localeCompare(b.dueDate);
    });
    mostOverdueInstanceId = sorted[0]?.id;
  }

  return { openCount, overdueCount, maxPenalty, mostOverdueInstanceId };
}
