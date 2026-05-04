import type { AppHeaderData } from "@/lib/app/header-data";
import { UserAccountMenu } from "@/components/layout/UserAccountMenu";
import { StreakBadge } from "@/components/layout/StreakBadge";

type Props = AppHeaderData & {
  userName: string;
};

export function AppUserHeader({
  householdName,
  userName,
  myColor,
  myAvatar,
  points,
  streak,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide truncate min-w-0 pr-2">
        {householdName || "—"}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${myColor}20` }}
        >
          {myAvatar}
        </span>
        <UserAccountMenu userName={userName} />
        <StreakBadge streak={streak} />
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{ backgroundColor: `${myColor}18`, color: myColor }}
        >
          {points} pts
        </span>
      </div>
    </div>
  );
}
