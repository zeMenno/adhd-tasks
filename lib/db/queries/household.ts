import { cache } from "react";
import { db } from "@/lib/db";
import { households, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export const getUserById = cache(async (userId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: { household: true },
  });
});
