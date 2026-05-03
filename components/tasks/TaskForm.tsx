"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createTask, updateTask } from "@/lib/tasks/actions";
import type { Task, User } from "@/lib/db/schema";

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
  users: User[];
  editTask?: Task | null;
};

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function TaskForm({ open, onClose, users, editTask }: Props) {
  const [isPending, startTransition] = useTransition();

  const [title, setTitle]                     = useState(editTask?.title ?? "");
  const [assignedUserId, setAssignedUserId]   = useState(editTask?.assignedUserId ?? null);
  const [ownerUserId, setOwnerUserId]         = useState(editTask?.ownerUserId ?? null);
  const [basePoints, setBasePoints]           = useState(editTask?.basePoints ?? 10);
  const [penaltyPerDay, setPenaltyPerDay]     = useState(editTask?.penaltyPerDay ?? 2);
  const [requiresApproval, setRequiresApproval] = useState(editTask?.requiresApproval ?? false);
  const [recurrenceType, setRecurrenceType]   = useState<RecurrenceType>(
    (editTask?.recurrenceType as RecurrenceType) ?? "once"
  );
  const [dayOfWeek, setDayOfWeek]             = useState(editTask?.recurrenceDayOfWeek ?? 0);
  const [dayOfMonth, setDayOfMonth]           = useState(editTask?.recurrenceDayOfMonth ?? 1);
  const [dueDate, setDueDate]                 = useState(today());

  function reset() {
    setTitle(""); setAssignedUserId(null); setOwnerUserId(null);
    setBasePoints(10); setPenaltyPerDay(2); setRequiresApproval(false);
    setRecurrenceType("once"); setDayOfWeek(0); setDayOfMonth(1);
    setDueDate(today());
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!title.trim()) return toast.error("Geef de taak een naam.");
    if (!dueDate)       return toast.error("Kies een datum.");

    const data = {
      title: title.trim(),
      assignedUserId,
      ownerUserId,
      basePoints,
      penaltyPerDay,
      requiresApproval,
      recurrenceType,
      recurrenceDayOfWeek: ["weekly", "biweekly"].includes(recurrenceType) ? dayOfWeek : null,
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
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl px-5 pb-10">
        <SheetHeader className="mb-5 pt-2">
          <SheetTitle className="text-xl font-extrabold">
            {editTask ? "Taak bewerken" : "Nieuwe taak"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {/* Title */}
          <Field label="Naam">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Afwassen"
              className="w-full h-12 px-3 rounded-xl border border-slate-200 text-slate-800 focus:border-indigo-400 focus:outline-none"
            />
          </Field>

          {/* Assigned user */}
          <Field label="Voor wie?">
            <div className="flex gap-2 flex-wrap">
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
                  {u.avatar} {u.name}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Owner */}
          <Field label="Goedgekeurd door">
            <div className="flex gap-2 flex-wrap">
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
                  {u.avatar} {u.name}
                </Pill>
              ))}
            </div>
          </Field>

          {/* Requires approval toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Vereist goedkeuring</span>
            <button
              onClick={() => setRequiresApproval((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                requiresApproval ? "bg-indigo-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  requiresApproval ? "translate-x-6" : "translate-x-0.5"
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
                  onClick={() => setRecurrenceType(opt.value)}
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
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setDayOfWeek(i)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                      dayOfWeek === i
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {day}
                  </button>
                ))}
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
