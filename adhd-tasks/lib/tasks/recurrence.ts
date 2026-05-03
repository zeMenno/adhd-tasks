import { addDays, addMonths, addWeeks, differenceInCalendarDays, startOfDay } from "date-fns";
import type { TaskStatus } from "@/lib/db/schema";

export type RecurrenceType = "once" | "daily" | "weekly" | "biweekly" | "monthly";

/**
 * Returns the next due date for a recurring task after completion,
 * based on the original due date (not completion date).
 * Returns null for one-time tasks.
 */
export function getNextDueDate(
  recurrenceType: RecurrenceType,
  originalDueDate: Date
): Date | null {
  const base = startOfDay(originalDueDate);
  switch (recurrenceType) {
    case "once":     return null;
    case "daily":    return addDays(base, 1);
    case "weekly":   return addWeeks(base, 1);
    case "biweekly": return addWeeks(base, 2);
    case "monthly":  return addMonths(base, 1);
  }
}

/**
 * Returns how many calendar days a task is overdue.
 * Returns 0 if the task is due today or in the future.
 */
export function calculateDaysOverdue(dueDate: Date, today: Date): number {
  const diff = differenceInCalendarDays(startOfDay(today), startOfDay(dueDate));
  return Math.max(0, diff);
}

/**
 * Calculates earned points after applying the daily penalty.
 * Points floor at 0 — they can never go negative.
 */
export function calculateEarnedPoints(
  basePoints: number,
  penaltyPerDay: number,
  daysOverdue: number
): number {
  return Math.max(0, basePoints - penaltyPerDay * daysOverdue);
}

/**
 * Returns true when a new recurring instance should be created.
 * - Never for 'once' tasks.
 * - For tasks requiring approval: only after status is 'approved' or 'completed'.
 * - For tasks without approval: after status is 'done' or 'completed'.
 */
export function shouldCreateNewInstance(
  recurrenceType: RecurrenceType,
  currentStatus: TaskStatus,
  requiresApproval: boolean
): boolean {
  if (recurrenceType === "once") return false;

  if (requiresApproval) {
    return currentStatus === "approved" || currentStatus === "completed";
  }
  return currentStatus === "done" || currentStatus === "completed";
}
