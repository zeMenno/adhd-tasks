"use client";

import { useCallback, useEffect } from "react";

const BADGE_REFRESH = "adhd-badge-refresh";
const BADGE_MAX = 99;

function applyBadge(count: number) {
  if (!("setAppBadge" in navigator)) return;
  if (count <= 0) {
    void navigator.clearAppBadge?.();
    return;
  }
  const n = Math.min(count, BADGE_MAX);
  void navigator.setAppBadge(n);
}

async function syncBadgeFromServer() {
  if (!("setAppBadge" in navigator) && !("clearAppBadge" in navigator)) return;

  const res = await fetch("/api/badge/open-count", { credentials: "include" });
  if (res.status === 401) {
    void navigator.clearAppBadge?.();
    return;
  }
  if (!res.ok) return;

  const data = (await res.json()) as { openCount?: number };
  const openCount = typeof data.openCount === "number" ? data.openCount : 0;
  applyBadge(openCount);
}

export function AppBadgeSync() {
  const sync = useCallback(() => {
    void syncBadgeFromServer();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("setAppBadge" in navigator) && !("clearAppBadge" in navigator)) return;

    sync();

    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) sync();
    };
    const onBadgeRefresh = () => sync();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener(BADGE_REFRESH, onBadgeRefresh);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener(BADGE_REFRESH, onBadgeRefresh);
    };
  }, [sync]);

  return null;
}

export function requestAppBadgeRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(BADGE_REFRESH));
}
