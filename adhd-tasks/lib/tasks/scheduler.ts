import { format, startOfDay } from "date-fns";
import {
  calculateDaysOverdue,
  getNextDueDate,
  shouldCreateNewInstance,
  type RecurrenceType,
} from "./recurrence";
import type { TaskStatus } from "@/lib/db/schema";
import {
  createTaskInstance,
  getCompletedRecurringInstances,
  getNextInstanceForTask,
  getOverdueOpenInstances,
  parseDateStr,
  updateDaysOverdue,
} from "./queries";

export async function runDailyScheduler(): Promise<{
  updated: number;
  created: number;
}> {
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  let updated = 0;
  let created = 0;

  // ── Step 1: Update daysOverdue for all open overdue instances ─────────────
  const overdueInstances = await getOverdueOpenInstances(todayStr);

  for (const instance of overdueInstances) {
    const dueDate = parseDateStr(instance.dueDate);
    const daysOverdue = calculateDaysOverdue(dueDate, today);
    await updateDaysOverdue(instance.id, daysOverdue);
    updated++;
  }

  // ── Step 2: Spawn next instances for completed recurring tasks ────────────
  const completedInstances = await getCompletedRecurringInstances();

  for (const instance of completedInstances) {
    const { task } = instance;

    const recurrenceType = task.recurrenceType as RecurrenceType;

    if (recurrenceType === "once") continue;
    if (!task.isActive) continue;

    // Only spawn when the current status warrants it
    if (!shouldCreateNewInstance(recurrenceType, instance.status as TaskStatus, task.requiresApproval)) {
      continue;
    }

    // Avoid duplicates — check if a future instance already exists
    const existing = await getNextInstanceForTask(task.id, instance.dueDate);
    if (existing) continue;

    const nextDate = getNextDueDate(recurrenceType, parseDateStr(instance.dueDate));
    if (!nextDate) continue;

    await createTaskInstance(task.id, nextDate, instance.assignedUserId);
    created++;
  }

  return { updated, created };
}
