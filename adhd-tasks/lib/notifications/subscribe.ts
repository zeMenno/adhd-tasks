function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type SubscribeResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "unsupported"
        | "denied"
        | "no_key"
        | "network"
        | "permission"
        | "unknown";
    };

/**
 * Registers SW, subscribes to push, POSTs keys to the API (cookies sent automatically).
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<SubscribeResult> {
  if (typeof window === "undefined") return { ok: false, reason: "unsupported" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  if (!vapidPublicKey.trim()) return { ok: false, reason: "no_key" };

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    const perm = Notification.permission;
    if (perm === "denied") return { ok: false, reason: "denied" };
    if (perm === "default") return { ok: false, reason: "permission" };
    if (perm !== "granted") return { ok: false, reason: "unknown" };

    const applicationServerKey: BufferSource = new Uint8Array(
      urlBase64ToUint8Array(vapidPublicKey)
    );

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: "unknown" };
    }

    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      }),
    });

    if (!res.ok) return { ok: false, reason: "network" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "unknown" };
  }
}
