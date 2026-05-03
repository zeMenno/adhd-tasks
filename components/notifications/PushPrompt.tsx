"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { subscribeToPush } from "@/lib/notifications/subscribe";

const DISMISS_KEY = "adhd-push-prompt-dismissed";

type Props = {
  userId: string;
  vapidPublicKey: string;
};

export function PushPrompt({ userId: _userId, vapidPublicKey }: Props) {
  void _userId;
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const trySubscribe = useCallback(async () => {
    setBusy(true);
    try {
      await subscribeToPush(vapidPublicKey);
    } finally {
      setBusy(false);
    }
  }, [vapidPublicKey]);

  useEffect(() => {
    if (permission !== "granted") return;
    void trySubscribe();
  }, [permission, trySubscribe]);

  async function onEnable() {
    if (!("Notification" in window)) return;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } finally {
      setBusy(false);
    }
  }

  function onDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) return null;
  if (typeof window !== "undefined" && !("Notification" in window)) return null;
  if (permission === "denied") {
    return (
      <p className="text-xs text-slate-400 mb-4">
        Meldingen staan uit in je browser. Je kunt ze later aanzetten in de site-instellingen.
      </p>
    );
  }
  if (permission === "granted") {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl bg-white shadow-sm px-4 py-4 flex gap-3 items-start">
      <div className="shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
        <Bell className="w-6 h-6 text-indigo-600" strokeWidth={2} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">Notificaties inschakelen?</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Herinneringen voor open taken (later op de dag). Op iPhone: voeg de app toe aan je beginscherm
          voor meldingen.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => void onEnable()}
            disabled={busy}
            className="flex-1 h-12 rounded-2xl bg-indigo-500 text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
          >
            {busy ? "Even geduld…" : "Inschakelen"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 h-12 rounded-2xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
