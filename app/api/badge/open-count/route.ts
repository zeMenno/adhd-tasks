import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOpenInstancesForUserForNotify } from "@/lib/notifications/instance-queries";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const rows = await getOpenInstancesForUserForNotify(
    session.householdId,
    session.userId,
    new Date()
  );

  return NextResponse.json({ openCount: rows.length });
}
