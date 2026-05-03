import type { NextRequest } from "next/server";

/** Vercel Cron and manual triggers must send this bearer token. */
export function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
