import type { PushNotificationPayload } from "@/lib/notifications/send";

export type NotificationPhase = 1 | 2 | 3;

/**
 * Builds Web Push JSON for the three daily reminder phases.
 * Copy: Dutch, calm, playful — aligned with STYLING_AND_BRANDING (emoji for scan only).
 */
export function buildNotificationPayload(
  phase: NotificationPhase,
  openCount: number,
  overdueCount: number,
  maxPenalty: number,
  instanceId?: string
): PushNotificationPayload {
  if (phase === 1) {
    return {
      title: `📋 ${openCount} ${openCount === 1 ? "taak" : "taken"} vandaag`,
      body: "Tik om te zien wat er nog gedaan moet worden.",
      tag: "phase1",
      url: "/today",
    };
  }
  if (phase === 2) {
    return {
      title: "⏰ Nog even herinneren",
      body: `Je hebt nog ${openCount} open ${openCount === 1 ? "taak" : "taken"}.`,
      tag: "phase2",
      url: "/today",
    };
  }
  return {
    title: `⚠️ ${overdueCount} ${overdueCount === 1 ? "taak is" : "taken zijn"} te laat`,
    body:
      maxPenalty > 0
        ? `Je mist al ${maxPenalty} ${maxPenalty === 1 ? "punt" : "punten"}. Pak het nu even op.`
        : "Er staat nog werk open. Pak het nu even op.",
    tag: "phase3",
    url: "/today",
    instanceId,
    actions: instanceId ? [{ action: "done", title: "✓ Gedaan" }] : [],
  };
}
