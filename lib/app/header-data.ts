import "server-only";

import { cache } from "react";
import { getHousehold, getUserById } from "@/lib/db/queries/household";
import { getHouseholdLeaderboard, getUserPoints } from "@/lib/points/queries";

export type AppHeaderData = {
  householdName: string;
  myColor: string;
  myAvatar: string;
  points: number;
  streak: number;
};

export const getAppHeaderData = cache(
  async (householdId: string, userId: string): Promise<AppHeaderData> => {
    const [household, leaderboard, points, user] = await Promise.all([
      getHousehold(),
      getHouseholdLeaderboard(householdId),
      getUserPoints(userId),
      getUserById(userId),
    ]);

    const me = leaderboard.find((u) => u.userId === userId);

    return {
      householdName: household?.name ?? "",
      myColor: me?.color ?? user?.color ?? "#6366f1",
      myAvatar: me?.avatar ?? user?.avatar ?? "👤",
      points,
      streak: user?.currentStreak ?? 0,
    };
  }
);
