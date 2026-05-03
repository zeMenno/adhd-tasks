import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users as usersTable } from "@/lib/db/schema";
import { getUserPoints, getUserTransactions, getHouseholdLeaderboard } from "@/lib/points/queries";
import { getHouseholdRewards } from "@/lib/rewards/queries";
import { RewardCard } from "@/components/rewards/RewardCard";
import { RewardsManageSection } from "@/components/rewards/RewardsManageSection";
import { TransactionHistory } from "@/components/rewards/TransactionHistory";

export default async function RewardsPage() {
  const session = await requireSession();

  const [allRewards, balance, transactions, leaderboard, currentUser] = await Promise.all([
    getHouseholdRewards(session.householdId),
    getUserPoints(session.userId),
    getUserTransactions(session.userId, 20),
    getHouseholdLeaderboard(session.householdId),
    db.query.users.findFirst({ where: eq(usersTable.id, session.userId) }),
  ]);

  const me = leaderboard.find((u) => u.userId === session.userId);
  const myColor = me?.color ?? currentUser?.color ?? "#6366f1";
  const myAvatar = me?.avatar ?? currentUser?.avatar ?? "👤";

  const activeRewards = allRewards.filter((r) => r.isActive);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Jouw saldo</span>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{ backgroundColor: `${myColor}20` }}
          >
            {myAvatar}
          </span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold"
            style={{ backgroundColor: `${myColor}18`, color: myColor }}
          >
            {balance} pts
          </span>
        </div>
      </div>

      <h1 className="mb-6 text-3xl font-extrabold text-slate-800">Beloningen</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Beschikbaar
        </h2>
        {activeRewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/80 py-14 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
              🎁
            </div>
            <p className="text-center text-sm font-semibold text-slate-600">
              Nog geen beloningen. Voeg er een toe!
            </p>
            <p className="text-center text-xs text-slate-400">Open hieronder &quot;Beloningen beheren&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {activeRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={{
                  id: reward.id,
                  title: reward.title,
                  description: reward.description,
                  pointsCost: reward.pointsCost,
                }}
                userBalance={balance}
              />
            ))}
          </div>
        )}
      </section>

      <RewardsManageSection rewards={allRewards} />

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Geschiedenis</h2>
        <TransactionHistory transactions={transactions} />
      </section>
    </div>
  );
}
