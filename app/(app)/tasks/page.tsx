import { requireSession } from "@/lib/auth/session";
import { getUsers } from "@/lib/db/queries/household";
import { getActiveTasks } from "@/lib/db/queries/tasks";
import { TasksManager } from "@/components/tasks/TasksManager";
import type { Task, User } from "@/lib/db/schema";

type TaskWithUsers = Task & {
  assignedUser: User | null;
  ownerUser: User | null;
};

export default async function TasksPage() {
  const session = await requireSession();
  const [tasks, users] = await Promise.all([
    getActiveTasks(session.householdId),
    getUsers(session.householdId),
  ]);

  return (
    <>
      <h1 className="text-3xl font-extrabold text-slate-800 mb-6">Taken</h1>
      <TasksManager tasks={tasks as TaskWithUsers[]} users={users} />
    </>
  );
}
