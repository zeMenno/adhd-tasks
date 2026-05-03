import "server-only";

import webpush from "web-push";
import { deleteDeviceById, listDevicesByUserId } from "@/lib/db/queries/devices";

export type PushNotificationPayload = {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  /** Shown as notification data for click / optional action */
  instanceId?: string;
  actions?: { action: string; title: string }[];
};

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  if (!publicKey || !privateKey || !email) {
    throw new Error("VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL must be set");
  }
  webpush.setVapidDetails(email, publicKey, privateKey);
  vapidConfigured = true;
}

/**
 * Sends the same JSON shape the service worker expects in the `push` event (`event.data.json()`).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  ensureVapid();

  const body = JSON.stringify(payload);
  const rows = await listDevicesByUserId(userId);
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };

    try {
      await webpush.sendNotification(subscription, body);
      sent++;
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) {
        await deleteDeviceById(row.id);
      }
      failed++;
    }
  }

  return { sent, failed };
}
