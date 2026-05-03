"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { Share } from "lucide-react";

const STORAGE_KEY = "install-dismissed";

type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIosBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIosDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIosDevice && isSafari;
}

function readStoredDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEventLike | null>(
    null
  );
  const [clientReady, setClientReady] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setClientReady(true);
    });
  }, []);

  const dismissed = userDismissed || readStoredDismissed();

  useEffect(() => {
    if (!clientReady || dismissed || isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEventLike);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [clientReady, dismissed]);

  const persistDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setUserDismissed(true);
    setDeferred(null);
  }, []);

  const onInstallClick = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
  }, [deferred]);

  if (!clientReady || dismissed || isStandalone()) return null;

  const showChrome = deferred !== null;
  const showIos = !showChrome && isIosBrowser();

  if (!showChrome && !showIos) return null;

  return (
    <div
      className="fixed left-3 right-3 z-40 rounded-2xl border border-slate-100 bg-white shadow-lg px-4 py-3"
      style={{
        bottom:
          "calc(5.75rem + max(0.75rem, env(safe-area-inset-bottom, 0px)))",
      }}
      role="region"
      aria-label="App installeren"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {showChrome
              ? "Installeer de app voor de beste ervaring"
              : "Zet ADHDTasks op je beginscherm"}
          </p>
          <button
            type="button"
            onClick={persistDismiss}
            className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-600 px-1 py-0.5 rounded-lg"
          >
            Sluiten
          </button>
        </div>
        {showIos ? (
          <p className="text-xs text-slate-500 flex items-start gap-2">
            <Share
              className="size-4 shrink-0 text-indigo-500 mt-0.5"
              aria-hidden
            />
            <span>
              Tik op <strong className="text-slate-700">Delen</strong> en kies{" "}
              <strong className="text-slate-700">Zet op beginscherm</strong>.
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onInstallClick}
            className="w-full h-10 rounded-xl bg-indigo-500 text-white text-sm font-bold active:scale-[0.98] transition-transform"
          >
            Installeren
          </button>
        )}
      </div>
    </div>
  );
}
