import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";

export async function getActiveTasks(householdId: string) {
  return db.query.tasks.findMany({
    where: and(eq(tasks.householdId, householdId), eq(tasks.isActive, true)),
    with: {
      assignedUser: true,
      ownerUser: true,
    },
    orderBy: (t, { asc }) => asc(t.createdAt),
  });
}

export async function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: { assignedUser: true, ownerUser: true },
  });
}
