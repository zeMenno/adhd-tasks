"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { TaskForm } from "./TaskForm";
import { deactivateTask } from "@/lib/tasks/actions";
import type { Task, User } from "@/lib/db/schema";
import type { HouseholdMember } from "@/lib/db/queries/household";

type TaskWithUsers = Task & {
  assignedUser: User | null;
  ownerUser: User | null;
};

type Props = {
  tasks: TaskWithUsers[];
  users: HouseholdMember[];
};

const RECURRENCE_LABELS: Record<string, string> = {
  once:     "Eenmalig",
  daily:    "Dagelijks",
  weekly:   "Wekelijks",
  biweekly: "2-wekelijks",
  monthly:  "Maandelijks",
};

const RECURRENCE_ORDER = ["once", "daily", "weekly", "biweekly", "monthly"];

export function TasksManager({ tasks, users }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  function openCreate() {
    setEditTask(null);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditTask(task);
    setFormOpen(true);
  }

  async function handleDeactivate(task: Task) {
    if (!confirm(`"${task.title}" verwijderen?`)) return;
    try {
      await deactivateTask(task.id);
    } catch {
      toast.error("Kan taak niet verwijderen");
    }
  }

  const grouped = RECURRENCE_ORDER.reduce<Record<string, TaskWithUsers[]>>(
    (acc, key) => {
      acc[key] = tasks.filter((t) => t.recurrenceType === key);
      return acc;
    },
    {}
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {RECURRENCE_ORDER.map((key) => {
          const group = grouped[key];
          if (group.length === 0) return null;
          return (
            <section key={key}>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {RECURRENCE_LABELS[key]}
              </h2>
              <div className="flex flex-col gap-2">
                {group.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onEdit={() => openEdit(task)}
                    onDeactivate={() => handleDeactivate(task)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
              📋
            </div>
            <p className="text-lg font-bold text-slate-700">Nog geen taken</p>
            <p className="text-slate-400 text-sm">
              Tik op + om een taak aan te maken.
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openCreate}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Taak toevoegen"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        users={users}
        editTask={editTask}
      />
    </>
  );
}

function TaskRow({
  task,
  onEdit,
  onDeactivate,
}: {
  task: TaskWithUsers;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const user = task.assignedUser;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3">
      {/* Avatar */}
      {user ? (
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: user.color + "20" }}
        >
          {user.avatar ?? "👤"}
        </span>
      ) : (
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-slate-100 shrink-0">
          👥
        </span>
      )}

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{task.title}</p>
        <p className="text-xs text-slate-400">
          {task.basePoints} pts
          {task.penaltyPerDay > 0 && ` · -${task.penaltyPerDay}/dag`}
          {task.requiresApproval && " · goedkeuring"}
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={onEdit}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
        aria-label="Bewerken"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={onDeactivate}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        aria-label="Verwijderen"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
