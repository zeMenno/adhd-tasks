"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { createReward, toggleReward } from "@/lib/rewards/actions";
import type { Reward } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

type Props = {
  rewards: Reward[];
};

export function RewardsManageSection({ rewards }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState(10);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Geef de beloning een naam.");
      return;
    }
    startTransition(async () => {
      try {
        await createReward({
          title: title.trim(),
          description: description.trim() || undefined,
          pointsCost: Number(pointsCost),
        });
        setTitle("");
        setDescription("");
        setPointsCost(10);
        toast.success("Beloning toegevoegd");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Er ging iets mis");
      }
    });
  }

  function handleToggle(rewardId: string) {
    startTransition(async () => {
      try {
        await toggleReward(rewardId);
        toast.success("Status bijgewerkt");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Er ging iets mis");
      }
    });
  }

  return (
    <details className="group mb-8 rounded-2xl border border-slate-100 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
        <span>Beloningen beheren</span>
        <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-slate-100 p-4">
        <form onSubmit={handleCreate} className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Nieuwe beloning</p>
          <div>
            <label htmlFor="reward-title" className="mb-1 block text-sm font-medium text-slate-700">
              Titel
            </label>
            <input
              id="reward-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 focus-visible:ring-2"
              placeholder="Bv. Extra schermtijd"
              disabled={pending}
            />
          </div>
          <div>
            <label htmlFor="reward-desc" className="mb-1 block text-sm font-medium text-slate-700">
              Beschrijving (optioneel)
            </label>
            <textarea
              id="reward-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 focus-visible:ring-2"
              disabled={pending}
            />
          </div>
          <div>
            <label htmlFor="reward-cost" className="mb-1 block text-sm font-medium text-slate-700">
              Punten
            </label>
            <input
              id="reward-cost"
              type="number"
              min={1}
              max={100_000}
              value={pointsCost}
              onChange={(e) => setPointsCost(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 focus-visible:ring-2"
              disabled={pending}
            />
          </div>
          <Button type="submit" disabled={pending}>
            Toevoegen
          </Button>
        </form>

        {rewards.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Alle beloningen</p>
            <ul className="flex flex-col gap-2">
              {rewards.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.pointsCost} pts · {r.isActive ? "Actief" : "Inactief"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => handleToggle(r.id)}
                  >
                    {r.isActive ? "Uitzetten" : "Aanzetten"}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
