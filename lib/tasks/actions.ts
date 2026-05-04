"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { taskInstances, tasks } from "@/lib/db/schema";
import { awardPoints } from "@/lib/points/award";
import { getInstanceById, approveInstance, createTaskInstance, parseDateStr } from "./queries";
import { shouldCreateNewInstance, getNextDueDate, type RecurrenceType } from "./recurrence";
import { initialInstanceDates } from "./weekdays";
import type { TaskStatus } from "@/lib/db/schema";
import { markTaskDoneWithSession } from "./completeTask";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function spawnNextInstance(
  taskId: string,
  recurrenceType: RecurrenceType,
  requiresApproval: boolean,
  status: TaskStatus,
  dueDateStr: string,
  assignedUserId: string | null
) {
  if (!shouldCreateNewInstance(recurrenceType, status, requiresApproval)) return;

  const nextDate = getNextDueDate(recurrenceType, parseDateStr(dueDateStr));
  if (!nextDate) return;

  await createTaskInstance(taskId, nextDate, assignedUserId);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function markTaskDone(instanceId: string) {
  const session = await requireSession();
  return markTaskDoneWithSession(session, instanceId);
}

export async function approveTask(instanceId: string) {
  const session = await requireSession();
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error("Taak niet gevonden");

  if (instance.task.ownerUserId !== session.userId) {
    throw new Error("Alleen de eigenaar kan deze taak goedkeuren");
  }

  if (instance.status !== "done") throw new Error("Taak wacht niet op goedkeuring");

  const updated = await approveInstance(instanceId, session.userId);

  // Award points to whoever marked done; fallbacks for legacy rows
  const recipientId =
    instance.completedByUserId ??
    instance.assignedUserId ??
    session.userId;
  let newStreak = 0;
  if (updated.earnedPoints && updated.earnedPoints > 0) {
    const award = await awardPoints(
      recipientId,
      instanceId,
      updated.earnedPoints,
      instance.task.title
    );
    newStreak = award.newStreak;
  }

  await spawnNextInstance(
    instance.task.id,
    instance.task.recurrenceType as RecurrenceType,
    instance.task.requiresApproval,
    updated.status as TaskStatus,
    instance.dueDate,
    instance.assignedUserId
  );

  revalidatePath("/today");
  return { earnedPoints: updated.earnedPoints ?? 0, newStreak };
}

// ─── Task management ──────────────────────────────────────────────────────────

const TaskSchema = z
  .object({
    title: z.string().min(1).max(100),
    assignedUserId: z.string().uuid().nullable(),
    ownerUserId: z.string().uuid().nullable(),
    basePoints: z.number().int().min(1).max(100),
    penaltyPerDay: z.number().int().min(0).max(20),
    requiresApproval: z.boolean(),
    recurrenceType: z.enum(["once", "daily", "weekly", "biweekly", "monthly"]),
    recurrenceDaysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).nullable(),
    recurrenceDayOfMonth: z.number().int().min(1).max(28).nullable(),
    dueDate: z.string().min(1),
  })
  .refine(
    (d) =>
      d.recurrenceType !== "weekly" && d.recurrenceType !== "biweekly"
        ? true
        : Array.isArray(d.recurrenceDaysOfWeek) && d.recurrenceDaysOfWeek.length > 0,
    { message: "Kies minstens één dag", path: ["recurrenceDaysOfWeek"] }
  );

export async function createTask(data: unknown) {
  const session = await requireSession();
  const parsed = TaskSchema.parse(data);

  const isWeekBased =
    parsed.recurrenceType === "weekly" || parsed.recurrenceType === "biweekly";
  const weekDays: number[] | null = isWeekBased ? parsed.recurrenceDaysOfWeek! : null;

  const anchor = parseDateStr(parsed.dueDate);
  const instanceDates = weekDays ? initialInstanceDates(anchor, weekDays) : [anchor];

  const taskId = randomUUID();
  const taskRow = {
    id: taskId,
    householdId: session.householdId,
    title: parsed.title,
    assignedUserId: parsed.assignedUserId,
    ownerUserId: parsed.ownerUserId,
    basePoints: parsed.basePoints,
    penaltyPerDay: parsed.penaltyPerDay,
    requiresApproval: parsed.requiresApproval,
    recurrenceType: parsed.recurrenceType,
    recurrenceDayOfWeek: null,
    recurrenceDaysOfWeek: weekDays,
    recurrenceDayOfMonth: parsed.recurrenceDayOfMonth,
  };

  const instanceRows = instanceDates.map((d) => ({
    taskId,
    assignedUserId: parsed.assignedUserId,
    dueDate: format(d, "yyyy-MM-dd"),
    status: "todo" as const,
    daysOverdue: 0,
  }));

  await db.batch([
    db.insert(tasks).values(taskRow),
    ...instanceRows.map((row) => db.insert(taskInstances).values(row)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/today");
}

export async function updateTask(taskId: string, data: unknown) {
  await requireSession();
  const parsed = TaskSchema.parse(data);

  const isWeekBased =
    parsed.recurrenceType === "weekly" || parsed.recurrenceType === "biweekly";

  await db
    .update(tasks)
    .set({
      title: parsed.title,
      assignedUserId: parsed.assignedUserId,
      ownerUserId: parsed.ownerUserId,
      basePoints: parsed.basePoints,
      penaltyPerDay: parsed.penaltyPerDay,
      requiresApproval: parsed.requiresApproval,
      recurrenceType: parsed.recurrenceType,
      recurrenceDayOfWeek: null,
      recurrenceDaysOfWeek: isWeekBased ? parsed.recurrenceDaysOfWeek! : null,
      recurrenceDayOfMonth: parsed.recurrenceDayOfMonth,
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/tasks");
  revalidatePath("/today");
}

export async function deactivateTask(taskId: string) {
  await requireSession();
  await db.update(tasks).set({ isActive: false }).where(eq(tasks.id, taskId));
  revalidatePath("/tasks");
}
