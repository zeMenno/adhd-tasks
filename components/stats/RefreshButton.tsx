"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="text-xs font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors px-3 py-1.5 rounded-lg bg-slate-100 active:scale-95"
    >
      {isPending ? "..." : "↻ Vernieuwen"}
    </button>
  );
}
