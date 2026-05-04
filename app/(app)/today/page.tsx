import { requireSession } from "@/lib/auth/session";
import { getTodayInstances } from "@/lib/tasks/queries";
import { getHouseholdLeaderboard } from "@/lib/points/queries";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TodayConfetti } from "@/components/layout/TodayConfetti";
import { PushPrompt } from "@/components/notifications/PushPrompt";
import type { TaskInstance, Task, User } from "@/lib/db/schema";

type InstanceWithRelations = TaskInstance & {
  task: Task & { assignedUser: User | null; ownerUser: User | null };
  assignedUser: User | null;
};

function sortInstances(instances: InstanceWithRelations[]) {
  return [...instances].sort((a, b) => {
    // Completed tasks sink to the bottom
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    // Most overdue first
    if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
    // Highest base points first
    return b.task.basePoints - a.task.basePoints;
  });
}

export default async function TodayPage() {
  const session = await requireSession();
  const [leaderboard, rawInstances] = await Promise.all([
    getHouseholdLeaderboard(session.householdId),
    getTodayInstances(session.householdId, new Date()),
  ]);

  const instances = sortInstances(rawInstances as InstanceWithRelations[]);
  const openCount = instances.filter(
    (i) => i.status !== "completed" && i.status !== "approved"
  ).length;
  const allDone = instances.length > 0 && openCount === 0;
  const noTasks = instances.length === 0;

  const todayPoints = instances
    .filter((i) => i.status === "completed" || i.status === "approved")
    .reduce((sum, i) => sum + (i.earnedPoints ?? 0), 0);

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";

  return (
    <>
      {allDone && <TodayConfetti />}

      <h1 className="text-3xl font-extrabold text-slate-800 mb-4">
        Vandaag
        {openCount > 0 && (
          <span className="ml-2 text-base font-semibold text-slate-400">
            {openCount} open
          </span>
        )}
      </h1>

      {vapidPublicKey ? (
        <PushPrompt userId={session.userId} vapidPublicKey={vapidPublicKey} />
      ) : null}

      {/* ── Points leaderboard pills ── */}
      <div className="flex gap-2 flex-wrap mb-6">
        {leaderboard.map((user) => (
          <div
            key={user.userId}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              user.userId === session.userId
                ? "ring-2 ring-offset-1"
                : "opacity-70"
            }`}
            style={{
              backgroundColor: user.color + "18",
              color: user.color,
              ["--ring-color" as string]: user.color,
            }}
          >
            <span>{user.avatar ?? "👤"}</span>
            <span>{user.name}</span>
            <span className="font-bold">{user.totalPoints} pts</span>
          </div>
        ))}
      </div>

      {/* ── Empty: no tasks at all ── */}
      {noTasks && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">
            ☀️
          </div>
          <p className="text-lg font-bold text-slate-700">Geen taken vandaag</p>
          <p className="text-slate-400 text-sm text-center">
            Maak een taak aan via het Taken-scherm.
          </p>
        </div>
      )}

      {/* ── All done celebration banner ── */}
      {allDone && (
        <div className="flex flex-col items-center gap-1.5 py-6 mb-4 bg-emerald-50 rounded-2xl">
          <span className="text-4xl">🎉</span>
          <p className="text-lg font-bold text-emerald-700">Alles gedaan voor vandaag!</p>
          {todayPoints > 0 && (
            <p className="text-sm text-emerald-600 font-semibold">
              +{todayPoints} pts verdiend vandaag
            </p>
          )}
        </div>
      )}

      {/* ── Task list ── */}
      {!noTasks && (
        <div className="flex flex-col gap-3">
          {instances.map((instance) => (
            <TaskCard
              key={instance.id}
              instance={instance as InstanceWithRelations}
              currentUserId={session.userId}
            />
          ))}
        </div>
      )}
    </>
  );
}
