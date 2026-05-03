import { NextRequest } from "next/server";
import { verifyCronRequest } from "@/lib/cron/auth";
import { runDailyScheduler } from "@/lib/tasks/scheduler";

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyScheduler();
  console.log("[Cron] Daily scheduler result:", result);
  return Response.json({ success: true, ...result });
}
