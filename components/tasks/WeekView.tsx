import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import type { TaskInstance, Task, User } from "@/lib/db/schema";

type InstanceWithRelations = TaskInstance & {
  task: Task & { assignedUser: User | null; ownerUser: User | null };
  assignedUser: User | null;
};

type Props = {
  todayInstances: InstanceWithRelations[];
  upcomingInstances: InstanceWithRelations[];
  today: Date;
};

function getWeekDays(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let current = startOfDay(from);
  const end = startOfDay(to);
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

function DaySection({
  date,
  instances,
  isToday,
}: {
  date: Date;
  instances: InstanceWithRelations[];
  isToday: boolean;
}) {
  const openCount = instances.filter(
    (i) => i.status !== "completed" && i.status !== "approved"
  ).length;
  const allDone = instances.length > 0 && openCount === 0;

  const dayLabel = isToday
    ? "Vandaag"
    : format(date, "EEEE d MMM", { locale: nl });

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-sm font-bold capitalize ${
            isToday ? "text-indigo-600" : "text-slate-700"
          }`}
        >
          {dayLabel}
        </span>
        {instances.length > 0 && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              allDone
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {allDone ? "✓ Klaar" : `${openCount} open`}
          </span>
        )}
      </div>

      {instances.length === 0 ? (
        <p className="text-sm text-slate-400 pl-1">Vrij</p>
      ) : (
        <div className="flex flex-col gap-2">
          {instances.map((instance) => {
            const displayUser = instance.assignedUser ?? instance.task.assignedUser;
            const isCompleted =
              instance.status === "completed" || instance.status === "approved";
            const points = isCompleted
              ? (instance.earnedPoints ?? instance.task.basePoints)
              : instance.task.basePoints;

            return (
              <div
                key={instance.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isCompleted
                    ? "bg-slate-50 border-slate-100 opacity-60"
                    : "bg-white border-slate-200"
                }`}
              >
                {isCompleted ? (
                  <span className="text-emerald-500 text-base">✓</span>
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                )}
                <span
                  className={`flex-1 text-sm font-medium ${
                    isCompleted ? "line-through text-slate-400" : "text-slate-700"
                  }`}
                >
                  {instance.task.title}
                </span>
                {displayUser && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: (displayUser.color ?? "#6366f1") + "18",
                      color: displayUser.color ?? "#6366f1",
                    }}
                  >
                    {displayUser.avatar ?? "👤"} {displayUser.name}
                  </span>
                )}
                <span className="text-xs font-bold text-amber-500 ml-1">
                  {points} pts
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WeekView({ todayInstances, upcomingInstances, today }: Props) {
  const sunday = (() => {
    const d = new Date(today);
    const day = d.getDay();
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + daysUntilSunday);
    return d;
  })();

  const tomorrow = addDays(startOfDay(today), 1);
  const upcomingDays = getWeekDays(tomorrow, sunday);

  const instancesByDate = (date: Date) =>
    upcomingInstances.filter((i) => {
      const [year, month, day] = i.dueDate.split("-").map(Number);
      const dueDate = new Date(year, month - 1, day);
      return isSameDay(dueDate, date);
    });

  return (
    <div>
      <DaySection
        date={today}
        instances={todayInstances}
        isToday
      />

      {upcomingDays.length > 0 && (
        <div className="mt-2 pt-4 border-t border-slate-100">
          {upcomingDays.map((day) => (
            <DaySection
              key={day.toISOString()}
              date={day}
              instances={instancesByDate(day)}
              isToday={false}
            />
          ))}
        </div>
      )}

      {upcomingDays.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          Het is al zondag — geen verdere dagen deze week.
        </p>
      )}
    </div>
  );
}
