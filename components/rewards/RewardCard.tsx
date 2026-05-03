"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { redeemReward } from "@/lib/rewards/actions";
import type { Reward } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  reward: Pick<Reward, "id" | "title" | "description" | "pointsCost">;
  userBalance: number;
};

function fireConfetti() {
  void import("canvas-confetti").then((mod) => {
    mod.default({ particleCount: 90, spread: 72, origin: { y: 0.65 } });
  });
}

export function RewardCard({ reward, userBalance }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const canAfford = userBalance >= reward.pointsCost;
  const shortfall = reward.pointsCost - userBalance;

  function handleRedeem() {
    startTransition(async () => {
      try {
        await redeemReward(reward.id);
        setOpen(false);
        toast.success(`🎉 Genoten van: ${reward.title}!`);
        fireConfetti();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Er ging iets mis");
      }
    });
  }

  return (
    <>
      <div
        className={`relative flex flex-col rounded-2xl bg-white p-4 shadow-sm ${
          canAfford
            ? "ring-2 ring-emerald-500/35"
            : "border border-slate-200 opacity-[0.92]"
        }`}
      >
        <h3 className="font-bold text-slate-800 leading-snug pr-1">{reward.title}</h3>
        {reward.description ? (
          <p className="mt-1 text-sm text-slate-500 line-clamp-3">{reward.description}</p>
        ) : null}
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-slate-600">{reward.pointsCost} pts</span>
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!canAfford || pending}
          onClick={() => canAfford && setOpen(true)}
        >
          Inwisselen
        </Button>
        {!canAfford && (
          <p className="mt-2 text-center text-xs text-slate-500">
            Nog {shortfall} punten nodig
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Beloning inwisselen</DialogTitle>
            <DialogDescription>
              Weet je het zeker? Dit kost je {reward.pointsCost} punten.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuleren
            </Button>
            <Button type="button" onClick={handleRedeem} disabled={pending}>
              {pending ? "Bezig…" : "Ja, inwisselen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
