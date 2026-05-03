import { addMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const bodySchema = z.object({
  minutes: z.number().int().min(5).max(480).optional().default(30),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const { minutes } = parsed.data;
  const snoozedUntil = addMinutes(new Date(), minutes);

  await db
    .update(users)
    .set({ snoozedUntil })
    .where(eq(users.id, session.userId));

  return Response.json({
    success: true,
    snoozedUntil: snoozedUntil.toISOString(),
  });
}
