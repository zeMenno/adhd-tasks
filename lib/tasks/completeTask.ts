import "server-only";

import { revalidatePath } from "next/cache";
import type { SessionPayload } from "@/lib/auth/session";
import { awardPoints } from "@/lib/points/award";
import {
  getInstanceById,
  completeInstance,
  createTaskInstance,
  parseDateStr,
} from "./queries";
import {
  shouldCreateNewInstance,
  getNextDueDate,
  type RecurrenceType,
} from "./recurrence";
import type { TaskStatus } from "@/lib/db/schema";

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

/**
 * Shared completion path for server actions and POST /api/tasks/done (service worker).
 */
export async function markTaskDoneWithSession(
  session: SessionPayload,
  instanceId: string
): Promise<{ earnedPoints: number; newStreak: number }> {
  const instance = await getInstanceById(instanceId);
  if (!instance) throw new Error("Taak niet gevonden");

  if (
    instance.assignedUserId &&
    instance.assignedUserId !== session.userId
  ) {
    throw new Error("Dit is niet jouw taak");
  }

  if (instance.status !== "todo") throw new Error("Taak is al afgerond");

  const updated = await completeInstance(instanceId, session.userId);

  let newStreak = 0;
  if (!instance.task.requiresApproval) {
    const recipientId =
      updated.completedByUserId ??
      instance.assignedUserId ??
      session.userId;
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
  }

  revalidatePath("/today");
  return { earnedPoints: updated.earnedPoints ?? 0, newStreak };
}
