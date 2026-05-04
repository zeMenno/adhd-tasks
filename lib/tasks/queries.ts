import { and, eq, gte, inArray, lte, not, or } from "drizzle-orm";
import { format, parse } from "date-fns";
import { db } from "@/lib/db";
import { taskInstances, tasks } from "@/lib/db/schema";
import { calculateDaysOverdue, calculateEarnedPoints } from "./recurrence";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a JS Date as 'yyyy-MM-dd' for Drizzle date columns */
function toDateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Parse a Drizzle date string ('yyyy-MM-dd') to local midnight */
export function parseDateStr(s: string): Date {
  return parse(s, "yyyy-MM-dd", new Date());
}

// ─── Read queries ─────────────────────────────────────────────────────────────

/**
 * Returns all task instances that are due today or overdue (not yet completed),
 * plus already-completed instances from today — so the user can see what's done.
 * Joins task definition + assigned user.
 */
export async function getTodayInstances(householdId: string, date: Date) {
  const todayStr = toDateStr(date);

  // Resolve task IDs belonging to this household first
  const householdTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.householdId, householdId), eq(tasks.isActive, true)));

  if (householdTasks.length === 0) return [];
  const taskIds = householdTasks.map((t) => t.id);

  return db.query.taskInstances.findMany({
    where: and(
      inArray(taskInstances.taskId, taskIds),
      or(
        // Due today or overdue and not yet completed
        and(
          lte(taskInstances.dueDate, todayStr),
          not(eq(taskInstances.status, "completed"))
        ),
        // Completed today — show so user sees their wins
        and(
          eq(taskInstances.dueDate, todayStr),
          eq(taskInstances.status, "completed")
        )
      )
    ),
    with: {
      task: {
        with: {
          assignedUser: true,
          ownerUser: true,
        },
      },
      assignedUser: true,
      approvedByUser: true,
    },
  });
}

export async function getInstanceById(id: string) {
  return db.query.taskInstances.findFirst({
    where: eq(taskInstances.id, id),
    with: {
      task: {
        with: {
          assignedUser: true,
          ownerUser: true,
        },
      },
      assignedUser: true,
    },
  });
}

// ─── Write queries ────────────────────────────────────────────────────────────

export async function createTaskInstance(
  taskId: string,
  dueDate: Date,
  assignedUserId: string | null
) {
  const [instance] = await db
    .insert(taskInstances)
    .values({
      taskId,
      assignedUserId,
      dueDate: toDateStr(dueDate),
      status: "todo",
      daysOverdue: 0,
    })
    .returning();
  return instance;
}

/**
 * Marks a task instance as 'done'.
 * Calculates earnedPoints based on current daysOverdue.
 * If the task does NOT require approval, status goes straight to 'completed'.
 */
export async function completeInstance(
  instanceId: string,
  completedByUserId: string
) {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error("Instance not found");

  const daysOverdue = calculateDaysOverdue(
    parseDateStr(instance.dueDate),
    new Date()
  );
  const earnedPoints = calculateEarnedPoints(
    instance.task.basePoints,
    instance.task.penaltyPerDay,
    daysOverdue
  );

  const newStatus = instance.task.requiresApproval ? "done" : "completed";

  const [updated] = await db
    .update(taskInstances)
    .set({
      status: newStatus,
      completedAt: new Date(),
      completedByUserId,
      earnedPoints,
      daysOverdue,
    })
    .where(eq(taskInstances.id, instanceId))
    .returning();

  return updated;
}

/**
 * Marks a task instance as 'approved' by the owner.
 * Final status: 'completed'.
 */
export async function approveInstance(instanceId: string, approverId: string) {
  const [updated] = await db
    .update(taskInstances)
    .set({
      status: "completed",
      approvedAt: new Date(),
      approvedByUserId: approverId,
    })
    .where(eq(taskInstances.id, instanceId))
    .returning();
  return updated;
}

/** True if this task already has an instance with the exact due date (yyyy-MM-dd). */
export async function hasInstanceWithDueDate(taskId: string, dueDateStr: string) {
  const row = await db.query.taskInstances.findFirst({
    where: and(eq(taskInstances.taskId, taskId), eq(taskInstances.dueDate, dueDateStr)),
  });
  return !!row;
}

/** Batch-update daysOverdue for a list of instance ids */
export async function updateDaysOverdue(instanceId: string, daysOverdue: number) {
  await db
    .update(taskInstances)
    .set({ daysOverdue })
    .where(eq(taskInstances.id, instanceId));
}

/**
 * Returns all task instances with dueDate between fromDate and toDate (inclusive).
 * Used for the week view to show upcoming tasks.
 */
export async function getWeekInstances(
  householdId: string,
  fromDate: Date,
  toDate: Date
) {
  const fromStr = toDateStr(fromDate);
  const toStr = toDateStr(toDate);

  const householdTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.householdId, householdId), eq(tasks.isActive, true)));

  if (householdTasks.length === 0) return [];
  const taskIds = householdTasks.map((t) => t.id);

  return db.query.taskInstances.findMany({
    where: and(
      inArray(taskInstances.taskId, taskIds),
      gte(taskInstances.dueDate, fromStr),
      lte(taskInstances.dueDate, toStr)
    ),
    with: {
      task: {
        with: {
          assignedUser: true,
          ownerUser: true,
        },
      },
      assignedUser: true,
      approvedByUser: true,
    },
  });
}

/** Returns all open (todo/done) instances with a dueDate before today */
export async function getOverdueOpenInstances(todayStr: string) {
  return db.query.taskInstances.findMany({
    where: and(
      or(
        eq(taskInstances.status, "todo"),
        eq(taskInstances.status, "done")
      ),
      // strictly before today
      and(
        not(eq(taskInstances.dueDate, todayStr)),
        lte(taskInstances.dueDate, todayStr)
      )
    ),
  });
}

/** Returns all instances that are completed and belong to recurring tasks */
export async function getCompletedRecurringInstances() {
  return db.query.taskInstances.findMany({
    where: or(
      eq(taskInstances.status, "completed"),
      eq(taskInstances.status, "approved")
    ),
    with: { task: true },
  });
}
