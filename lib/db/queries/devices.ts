import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { devices } from "@/lib/db/schema";

export async function upsertDeviceByEndpoint(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const existing = await db.query.devices.findFirst({
    where: eq(devices.endpoint, input.endpoint),
  });

  if (existing) {
    await db
      .update(devices)
      .set({
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
      })
      .where(eq(devices.id, existing.id));
    return existing.id;
  }

  const [row] = await db
    .insert(devices)
    .values({
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    })
    .returning({ id: devices.id });
  return row.id;
}

export async function listDevicesByUserId(userId: string) {
  return db.query.devices.findMany({
    where: eq(devices.userId, userId),
  });
}

export async function deleteDeviceById(id: string) {
  await db.delete(devices).where(eq(devices.id, id));
}
