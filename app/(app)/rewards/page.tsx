import { requireSession } from "@/lib/auth/session";
import { getUserPoints, getUserTransactions } from "@/lib/points/queries";
import { getHouseholdRewards } from "@/lib/rewards/queries";
import { RewardCard } from "@/components/rewards/RewardCard";
import { RewardsManageSection } from "@/components/rewards/RewardsManageSection";
import { TransactionHistory } from "@/components/rewards/TransactionHistory";

export default async function RewardsPage() {
  const session = await requireSession();

  const [allRewards, balance, transactions] = await Promise.all([
    getHouseholdRewards(session.householdId),
    getUserPoints(session.userId),
    getUserTransactions(session.userId, 20),
  ]);

  const activeRewards = allRewards.filter((r) => r.isActive);

  return (
    <>
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
    </>
  );
}
