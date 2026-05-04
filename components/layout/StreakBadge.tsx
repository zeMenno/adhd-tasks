"use client";

import { useEffect, useState } from "react";

type Props = { streak: number };

export function StreakBadge({ streak }: Props) {
  const [animated, setAnimated] = useState(false);
  const streakActive = streak > 0;

  useEffect(() => {
    if (streakActive) {
      setAnimated(true);
      const t = setTimeout(() => setAnimated(false), 400);
      return () => clearTimeout(t);
    }
  }, [streak, streakActive]);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
        streakActive ? "bg-orange-50 text-orange-500" : "bg-slate-100 text-slate-400"
      } ${animated ? "animate-streak-pop" : ""}`}
      title={
        streakActive
          ? `${streak} ${streak === 1 ? "dag" : "dagen"} op rij!`
          : "Doe vandaag een taak om je streak te starten"
      }
    >
      <span>🔥</span>
      <span>{streak}</span>
    </span>
  );
}
