import { cache } from "react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

/** Safe to pass to Client Components (no PIN or other sensitive fields). */
export type HouseholdMember = {
  id: string;
  name: string;
  color: string;
  avatar: string | null;
};

export const getHousehold = cache(async () => {
  return db.query.households.findFirst();
});

export async function listHouseholds() {
  return db.query.households.findMany();
}

export async function getUsers(householdId: string) {
  return db.query.users.findMany({
    where: eq(users.householdId, householdId),
    orderBy: (u, { asc }) => asc(u.name),
  });
}

/** Household users for pickers / PIN screen — explicit columns, server-only fields omitted. */
export async function getHouseholdMembers(
  householdId: string,
): Promise<HouseholdMember[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      color: users.color,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.householdId, householdId))
    .orderBy(asc(users.name));
}

export const getUserById = cache(async (userId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { household: true },
  });
});
