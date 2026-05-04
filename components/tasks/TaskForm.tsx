"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createTask, updateTask } from "@/lib/tasks/actions";
import type { Task } from "@/lib/db/schema";
import type { HouseholdMember } from "@/lib/db/queries/household";

type RecurrenceType = "once" | "daily" | "weekly" | "biweekly" | "monthly";

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "once",     label: "Eenmalig"    },
  { value: "daily",   label: "Dagelijks"   },
  { value: "weekly",  label: "Wekelijks"   },
  { value: "biweekly",label: "2-wekelijks" },
  { value: "monthly", label: "Maandelijks" },
];

const DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

type Props = {
  open: boolean;
  onClose: () => void;
  users: HouseholdMember[];
  editTask?: Task | null;
};

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function TaskForm({ open, onClose, users, editTask }: Props) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle]                     = useState("");
  const [assignedUserId, setAssignedUserId]   = useState<string | null>(null);
  const [ownerUserId, setOwnerUserId]         = useState<string | null>(null);
  const [basePoints, setBasePoints]           = useState(10);
  const [penaltyPerDay, setPenaltyPerDay]     = useState(2);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [recurrenceType, setRecurrenceType]   = useState<RecurrenceType>("once");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0]);
  const [dayOfMonth, setDayOfMonth]           = useState(1);
  const [dueDate, setDueDate]                 = useState(today());

  function resetToDefaults() {
    setTitle("");
    setAssignedUserId(null);
    setOwnerUserId(null);
    setBasePoints(10);
    setPenaltyPerDay(2);
    setRequiresApproval(false);
    setRecurrenceType("once");
    setSelectedWeekdays([0]);
    setDayOfMonth(1);
    setDueDate(today());
  }

  function loadFromTask(task: Task) {
    setTitle(task.title);
    setAssignedUserId(task.assignedUserId);
    setOwnerUserId(task.ownerUserId);
    setBasePoints(task.basePoints);
    setPenaltyPerDay(task.penaltyPerDay);
    setRequiresApproval(task.requiresApproval);
    setRecurrenceType((task.recurrenceType as RecurrenceType) ?? "once");
    const weekDays =
      task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.length > 0
        ? [...task.recurrenceDaysOfWeek].sort((a, b) => a - b)
        : task.recurrenceDayOfWeek != null
          ? [task.recurrenceDayOfWeek]
          : [0];
    setSelectedWeekdays(weekDays);
    setDayOfMonth(task.recurrenceDayOfMonth ?? 1);
    setDueDate(today());
  }

  useEffect(() => {
    if (!open) return;
    if (editTask) loadFromTask(editTask);
    else resetToDefaults();
  }, [open, editTask]);

  function handleClose() {
    resetToDefaults();
    onClose();
  }

  function toggleWeekday(i: number) {
    setSelectedWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return [...next].sort((a, b) => a - b);
    });
  }

  function handleSubmit() {
    if (!title.trim()) return toast.error("Geef de taak een naam.");
    if (!dueDate)       return toast.error("Kies een datum.");
    if (
      (recurrenceType === "weekly" || recurrenceType === "biweekly") &&
      selectedWeekdays.length === 0
    ) {
      return toast.error("Kies minstens één dag van de week.");
    }

    const data = {
      title: title.trim(),
      assignedUserId,
      ownerUserId,
      basePoints,
      penaltyPerDay,
      requiresApproval,
      recurrenceType,
      recurrenceDaysOfWeek:
        recurrenceType === "weekly" || recurrenceType === "biweekly"
          ? selectedWeekdays
          : null,
      recurrenceDayOfMonth: recurrenceType === "monthly" ? dayOfMonth : null,
      dueDate,
    };

    startTransition(async () => {
      try {
        if (editTask) {
          await updateTask(editTask.id, data);
          toast.success("Taak bijgewerkt");
        } else {
          await createTask(data);
          toast.success("Taak aangemaakt");
        }
        handleClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Er ging iets mis");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] w-full min-w-0 overflow-y-auto overflow-x-hidden rounded-t-2xl px-5 pb-10"
      >
        <SheetHeader className="mb-5 pt-2">
          <SheetTitle className="text-xl font-extrabold">
            {editTask ? "Taak bewerken" : "Nieuwe taak"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-w-0 w-full flex-col gap-5">
          {/* Title */}
          <Field label="Naam">
            <input
              type="text"
              name="task-title"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Afwassen"
              className="w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none"
            />
          </Field>

          {/* Assigned user */}
          <Field label="Voor wie?">
            <div className="flex min-w-0 w-full flex-wrap gap-2">
              <Pill
                active={assignedUserId === null}
                onClick={() => setAssignedUserId(null)}
                color="#64748b"
              >
                Iedereen
              </Pill>
              {users.map((u) => (
                <Pill
                  key={u.id}
                  active={assignedUserId === u.id}
                  onClick={() => setAssignedUserId(u.id)}
                  color={u.color}
                >
                  {u.avatar ?? "👤"} {u.name}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Owner */}
          <Field label="Goedgekeurd door">
            <div className="flex min-w-0 w-full flex-wrap gap-2">
              <Pill
                active={ownerUserId === null}
                onClick={() => setOwnerUserId(null)}
                color="#64748b"
              >
                Niemand
              </Pill>
              {users.map((u) => (
                <Pill
                  key={u.id}
                  active={ownerUserId === u.id}
                  onClick={() => setOwnerUserId(u.id)}
                  color={u.color}
                >
                  {u.avatar ?? "👤"} {u.name}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Requires approval toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Vereist goedkeuring</span>
            <button
              type="button"
              onClick={() => setRequiresApproval((v) => !v)}
              className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${
                requiresApproval ? "bg-indigo-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  requiresApproval ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Points + penalty */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Punten">
              <input
                type="number"
                min={1} max={100}
                value={basePoints}
                onChange={(e) => setBasePoints(Number(e.target.value))}
                className="w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none"
              />
            </Field>
            <Field label="Straf per dag">
              <input
                type="number"
                min={0} max={20}
                value={penaltyPerDay}
                onChange={(e) => setPenaltyPerDay(Number(e.target.value))}
                className="w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none"
              />
            </Field>
          </div>

          {/* Recurrence type */}
          <Field label="Herhaling">
            <div className="grid grid-cols-5 gap-1">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRecurrenceType(opt.value);
                    if (
                      (opt.value === "weekly" || opt.value === "biweekly") &&
                      selectedWeekdays.length === 0
                    ) {
                      setSelectedWeekdays([0]);
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    recurrenceType === opt.value
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Day of week (weekly / biweekly) */}
          {(recurrenceType === "weekly" || recurrenceType === "biweekly") && (
            <Field label="Dag van de week">
              <div className="flex gap-1">
                {DAYS.map((day, i) => {
                  const selected = selectedWeekdays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleWeekday(i)}
                      className={`relative flex min-h-11 flex-1 items-center justify-center rounded-xl py-2 text-xs font-semibold transition-all ${
                        selected
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selected ? (
                        <Check
                          className="absolute top-1 right-1 size-3 shrink-0 stroke-[3] opacity-95"
                          aria-hidden
                        />
                      ) : null}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {/* Day of month (monthly) */}
          {recurrenceType === "monthly" && (
            <Field label="Dag van de maand">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDayOfMonth(d)}
                    className={`h-9 rounded-lg text-sm font-semibold transition-all ${
                      dayOfMonth === d
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* Due date */}
          {!editTask && (
            <Field label={recurrenceType === "once" ? "Vervaldatum" : "Eerste keer op"}>
              <input
                type="date"
                value={dueDate}
                min={today()}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none"
              />
            </Field>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-indigo-500 text-white font-bold text-base disabled:opacity-50 active:scale-95 transition-all mt-2"
          >
            {isPending ? "Opslaan..." : editTask ? "Wijzigingen opslaan" : "Taak aanmaken"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
  color,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
      style={
        active
          ? { backgroundColor: color, color: "#fff" }
          : { backgroundColor: color + "18", color }
      }
    >
      {children}
    </button>
  );
}
