import { requireSession } from "@/lib/auth/session";
import { getHouseholdStats } from "@/lib/stats/queries";
import { RefreshButton } from "@/components/stats/RefreshButton";

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default async function StatsPage() {
  const session = await requireSession();
  const stats = await getHouseholdStats(session.householdId);

  if (stats.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Statistieken</h1>
        <p className="text-slate-400 text-sm">Nog geen data. Maak eerst taken aan.</p>
      </>
    );
  }

  const maxWeekPoints = Math.max(...stats.map((s) => s.weekPoints), 1);
  const maxTotalPoints = Math.max(...stats.map((s) => s.totalPoints), 1);
  const householdWeekPoints = stats.reduce((sum, s) => sum + s.weekPoints, 0);
  const streakSorted = [...stats].sort((a, b) => b.currentStreak - a.currentStreak);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">Statistieken</h1>
        <RefreshButton />
      </div>

      {/* ── Section 1: Deze week ── */}
      <StatSection title="Deze week">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <p className="text-xs text-slate-400 mb-1">Huishouden totaal</p>
          <p className="text-4xl font-extrabold text-slate-800">
            {householdWeekPoints}
            <span className="text-lg font-semibold text-slate-400 ml-1">pts</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {stats.map((u) => (
            <div key={u.userId} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: u.color + "20" }}
                  >
                    {u.avatar ?? "👤"}
                  </span>
                  <span className="font-semibold text-slate-700 text-sm">{u.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: u.color }}>
                  {u.weekPoints} pts
                </span>
              </div>
              <Bar pct={(u.weekPoints / maxWeekPoints) * 100} color={u.color} />
            </div>
          ))}
        </div>
      </StatSection>

      {/* ── Section 2: Voltooiingsgraad ── */}
      <StatSection title="Voltooiingsgraad — laatste 7 dagen">
        <div className="flex flex-col gap-3">
          {stats.map((u) => {
            const rate =
              u.totalLast7 > 0
                ? Math.round((u.completedLast7 / u.totalLast7) * 100)
                : null;

            return (
              <div key={u.userId} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: u.color + "20" }}
                    >
                      {u.avatar ?? "👤"}
                    </span>
                    <span className="font-semibold text-slate-700 text-sm">{u.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">
                    {rate !== null ? (
                      <>
                        {u.completedLast7}/{u.totalLast7}{" "}
                        <span style={{ color: u.color }}>({rate}%)</span>
                      </>
                    ) : (
                      <span className="text-slate-300 font-normal">geen taken</span>
                    )}
                  </span>
                </div>
                <Bar pct={rate ?? 0} color={u.color} />
              </div>
            );
          })}
        </div>
      </StatSection>

      {/* ── Section 3: Streaks ── */}
      <StatSection title="Streaks">
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-slate-100">
          {streakSorted.map((u, i) => (
            <div key={u.userId} className="flex items-center gap-3 px-4 py-3">
              <span className="text-sm font-bold text-slate-300 w-5 text-center">
                {i + 1}
              </span>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: u.color + "20" }}
              >
                {u.avatar ?? "👤"}
              </span>
              <span className="flex-1 font-semibold text-slate-700 text-sm">
                {u.name}
              </span>
              <span
                className={`flex items-center gap-1 text-sm font-bold ${
                  u.currentStreak > 0 ? "text-orange-500" : "text-slate-300"
                }`}
              >
                <span>🔥</span>
                <span>
                  {u.currentStreak}{" "}
                  {u.currentStreak === 1 ? "dag" : "dagen"}
                </span>
              </span>
            </div>
          ))}
        </div>
      </StatSection>

      {/* ── Section 4: All time ── */}
      <StatSection title="Alle tijden">
        <div className="flex flex-col gap-3">
          {stats.map((u) => (
            <div key={u.userId} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: u.color + "20" }}
                  >
                    {u.avatar ?? "👤"}
                  </span>
                  <span className="font-semibold text-slate-700 text-sm">{u.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: u.color }}>
                  {u.totalPoints} pts
                </span>
              </div>
              <Bar pct={(u.totalPoints / maxTotalPoints) * 100} color={u.color} />
            </div>
          ))}
        </div>
      </StatSection>
    </>
  );
}
