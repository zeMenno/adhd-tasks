"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ViewTabs() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "today";

  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
      <Link
        href="/today"
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          view === "today"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Vandaag
      </Link>
      <Link
        href="/today?view=week"
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
          view === "week"
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Deze week
      </Link>
    </div>
  );
}
