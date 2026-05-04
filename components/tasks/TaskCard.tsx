"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { markTaskDone, approveTask } from "@/lib/tasks/actions";
import { calculateEarnedPoints } from "@/lib/tasks/recurrence";
import type { TaskInstance, Task, User } from "@/lib/db/schema";

type InstanceWithRelations = TaskInstance & {
  task: Task & {
    assignedUser: User | null;
    ownerUser: User | null;
  };
  assignedUser: User | null;
};

type Props = {
  instance: InstanceWithRelations;
  currentUserId: string;
};

export function TaskCard({ instance, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [floatingPoints, setFloatingPoints] = useState<number | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  const { task } = instance;
  const status = optimisticStatus ?? instance.status;

  const isCompleted = status === "completed" || status === "approved";
  const isAwaitingApproval = status === "done";
  const isOverdue = instance.daysOverdue > 0 && !isCompleted;
  const isOwner = task.ownerUserId === currentUserId;
  const isAssignee = !instance.assignedUserId || instance.assignedUserId === currentUserId;

  const earnedPoints = isCompleted
    ? (instance.earnedPoints ?? 0)
    : calculateEarnedPoints(task.basePoints, task.penaltyPerDay, instance.daysOverdue);
  const penaltyAmount = task.basePoints - earnedPoints;

  const displayUser = instance.assignedUser ?? task.assignedUser;

  function handleDone() {
    setJustCompleted(true);
    setOptimisticStatus(task.requiresApproval ? "done" : "completed");
    startTransition(async () => {
      try {
        const result = await markTaskDone(instance.id);
        if (!task.requiresApproval && result.earnedPoints > 0) {
          setFloatingPoints(result.earnedPoints);
          setTimeout(() => setFloatingPoints(null), 1000);
        }
        if (result.newStreak > 1) {
          toast(`🔥 Streak! ${result.newStreak} dagen op rij!`, { duration: 3000 });
        }
      } catch (err) {
        setJustCompleted(false);
        setOptimisticStatus(null);
        toast.error(err instanceof Error ? err.message : "Er ging iets mis");
      }
    });
  }

  function handleApprove() {
    setOptimisticStatus("completed");
    startTransition(async () => {
      try {
        const result = await approveTask(instance.id);
        if (result.earnedPoints > 0) {
          setFloatingPoints(result.earnedPoints);
          setTimeout(() => setFloatingPoints(null), 1000);
        }
        if (result.newStreak > 1) {
          toast(`🔥 Streak! ${result.newStreak} dagen op rij!`, { duration: 3000 });
        }
      } catch (err) {
        setOptimisticStatus(null);
        toast.error(err instanceof Error ? err.message : "Er ging iets mis");
      }
    });
  }

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm overflow-visible transition-all duration-300 ${
        isCompleted ? "opacity-60" : ""
      } ${isOverdue ? "border-l-4 border-red-500" : ""} ${
        justCompleted && isCompleted ? "animate-task-complete" : ""
      }`}
    >
      {/* Floating points animation */}
      {floatingPoints !== null && (
        <div className="absolute -top-2 right-4 pointer-events-none z-10 animate-float-up">
          <span className="text-emerald-500 font-extrabold text-lg drop-shadow-sm">
            +{floatingPoints} pts
          </span>
        </div>
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center z-10">
          <span className="text-emerald-600 text-sm font-bold">✓</span>
        </div>
      )}

      <div className="p-4">
        {/* Title + user */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Pulsing red dot for overdue */}
            {isOverdue && (
              <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
            <h3
              className={`font-bold text-slate-800 text-lg leading-tight ${
                isCompleted ? "line-through text-slate-400" : ""
              }`}
            >
              {task.title}
            </h3>
          </div>

          {displayUser && !isCompleted && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: displayUser.color + "20" }}
              >
                {displayUser.avatar ?? "👤"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {displayUser.name}
              </span>
            </div>
          )}
        </div>

        {/* Points + penalty + overdue */}
        {!isCompleted && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`text-sm font-bold ${
                isOverdue ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              +{earnedPoints} pts
            </span>

            {isOverdue && penaltyAmount > 0 && (
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                -{penaltyAmount} straf
              </span>
            )}

            {isOverdue && (
              <span className="text-xs text-red-500 ml-auto">
                ⚠️ {instance.daysOverdue}{" "}
                {instance.daysOverdue === 1 ? "dag" : "dagen"} te laat
              </span>
            )}

            {/* Penalty rate hint */}
            {isOverdue && task.penaltyPerDay > 0 && (
              <span className="w-full text-xs text-slate-400 mt-0.5">
                Verliest {task.penaltyPerDay} pts per dag
              </span>
            )}
          </div>
        )}

        {/* Completed: show earned points */}
        {isCompleted && instance.earnedPoints !== null && (
          <p className="text-sm text-emerald-600 font-semibold mb-2">
            +{instance.earnedPoints} pts verdiend ✓
          </p>
        )}

        {/* Action buttons */}
        {!isCompleted && (
          <div className="flex gap-2">
            {status === "todo" && isAssignee && (
              <button
                onClick={handleDone}
                disabled={isPending}
                className="flex-1 h-14 rounded-xl bg-emerald-500 text-white font-bold text-sm active:scale-95 disabled:opacity-50 transition-all"
              >
                {isPending ? "Bezig..." : "✓ Gedaan"}
              </button>
            )}

            {status === "todo" && !isAssignee && (
              <div className="flex-1 h-14 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium flex items-center justify-center">
                Toegewezen aan {displayUser?.name}
              </div>
            )}

            {isAwaitingApproval && (
              <>
                <div className="flex-1 h-14 rounded-xl bg-slate-100 text-slate-400 text-sm font-medium flex items-center justify-center">
                  ⏳ Wacht op goedkeuring
                </div>
                {isOwner && (
                  <button
                    onClick={handleApprove}
                    disabled={isPending}
                    className="h-14 px-4 rounded-xl bg-indigo-500 text-white font-bold text-sm active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isPending ? "..." : "Goedkeuren"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
