"use client";

import { useEffect } from "react";

export function TodayConfetti() {
  useEffect(() => {
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.55 } });
    });
  }, []);

  return null;
}
