import { NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron/auth";
import { getUsers, listHouseholds } from "@/lib/db/queries/household";
import {
  getOpenInstancesForUserForNotify,
  summarizeNotifyInstances,
} from "@/lib/notifications/instance-queries";
import { buildNotificationPayload, type NotificationPhase } from "@/lib/notifications/phases";
import { sendPushToUser } from "@/lib/notifications/send";

/** Vercel crons are UTC; these times match BUILD_PLAN (≈ 18:00 / 19:00 / 21:00 in UTC+2 summer). */
function parsePhaseParam(raw: string): NotificationPhase | null {
  if (raw === "phase1") return 1;
  if (raw === "phase2") return 2;
  if (raw === "phase3") return 3;
  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ phase: string }> }
) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phase: phaseParam } = await context.params;
  const phase = parsePhaseParam(phaseParam);
  if (phase === null) {
    return Response.json({ error: "Invalid phase" }, { status: 400 });
  }

  const today = new Date();
  let notified = 0;
  let skipped = 0;
  let pushesSent = 0;
  let pushesFailed = 0;

  const households = await listHouseholds();

  for (const household of households) {
    const users = await getUsers(household.id);

    for (const user of users) {
      if (user.snoozedUntil && user.snoozedUntil > today) {
        skipped++;
        continue;
      }

      const rows = await getOpenInstancesForUserForNotify(household.id, user.id, today);
      const metrics = summarizeNotifyInstances(rows);

      if (phase === 1 || phase === 2) {
        if (metrics.openCount === 0) {
          skipped++;
          continue;
        }
      } else {
        if (metrics.overdueCount === 0) {
          skipped++;
          continue;
        }
      }

      const payload = {
        ...buildNotificationPayload(
          phase,
          metrics.openCount,
          metrics.overdueCount,
          metrics.maxPenalty,
          phase === 3 ? metrics.mostOverdueInstanceId : undefined
        ),
        badgeCount: metrics.openCount,
      };

      const { sent, failed } = await sendPushToUser(user.id, payload);
      pushesSent += sent;
      pushesFailed += failed;
      if (sent > 0 || failed > 0) notified++;
      else skipped++;
    }
  }

  return Response.json({
    success: true,
    phase,
    notified,
    skipped,
    pushesSent,
    pushesFailed,
  });
}
