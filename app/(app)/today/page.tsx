import { Suspense } from "react";
import { requireSession } from "@/lib/auth/session";
import { getTodayInstances, getWeekInstances } from "@/lib/tasks/queries";
import { getHouseholdLeaderboard } from "@/lib/points/queries";
import { TaskCard } from "@/components/tasks/TaskCard";
import { ViewTabs } from "@/components/tasks/ViewTabs";
import { WeekView } from "@/components/tasks/WeekView";
import { TodayConfetti } from "@/components/layout/TodayConfetti";
import { PushPrompt } from "@/components/notifications/PushPrompt";
import { addDays, startOfDay } from "date-fns";
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

function getSundayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return startOfDay(d);
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession();
  const { view } = await searchParams;
  const isWeekView = view === "week";

  const today = new Date();
  const sunday = getSundayOfWeek(today);
  const tomorrow = addDays(startOfDay(today), 1);

  const [leaderboard, rawInstances, rawUpcoming] = await Promise.all([
    getHouseholdLeaderboard(session.householdId),
    getTodayInstances(session.householdId, today),
    isWeekView
      ? getWeekInstances(session.householdId, tomorrow, sunday)
      : Promise.resolve([]),
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
      {allDone && !isWeekView && <TodayConfetti />}

      <h1 className="text-3xl font-extrabold text-slate-800 mb-4">
        {isWeekView ? "Deze week" : "Vandaag"}
        {!isWeekView && openCount > 0 && (
          <span className="ml-2 text-base font-semibold text-slate-400">
            {openCount} open
          </span>
        )}
      </h1>

      {vapidPublicKey ? (
        <PushPrompt userId={session.userId} vapidPublicKey={vapidPublicKey} />
      ) : null}

      {/* ── Points leaderboard pills ── */}
      <div className="flex gap-2 flex-wrap mb-5">
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

      {/* ── Tab switcher ── */}
      <Suspense fallback={
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          <div className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white text-slate-800 shadow-sm">Vandaag</div>
          <div className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-500">Deze week</div>
        </div>
      }>
        <ViewTabs />
      </Suspense>

      {/* ── Week view ── */}
      {isWeekView && (
        <WeekView
          todayInstances={instances}
          upcomingInstances={rawUpcoming as InstanceWithRelations[]}
          today={today}
        />
      )}

      {/* ── Today view ── */}
      {!isWeekView && (
        <>
          {/* Empty: no tasks at all */}
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

          {/* All done celebration banner */}
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

          {/* Task list */}
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
      )}
    </>
  );
}
