import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { UserTransactionRow } from "@/lib/points/queries";

type Props = {
  transactions: UserTransactionRow[];
};

function rowLabel(row: UserTransactionRow): string {
  const taskTitle = row.taskInstance?.task?.title;
  if (taskTitle) return taskTitle;
  return row.description;
}

export function TransactionHistory({ transactions }: Props) {
  if (transactions.length === 0) {
    return <p className="text-sm text-slate-400">Nog geen transacties.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {transactions.map((t) => {
        const positive = t.points > 0;
        return (
          <li
            key={t.id}
            className={`flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
              positive
                ? "bg-emerald-50 text-emerald-950"
                : "bg-red-50 text-red-950"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{rowLabel(t)}</p>
              <p className="mt-0.5 text-xs opacity-80">
                {format(t.createdAt, "d MMM yyyy, HH:mm", { locale: nl })}
              </p>
            </div>
            <span className={`shrink-0 font-bold tabular-nums ${positive ? "text-emerald-700" : "text-red-700"}`}>
              {positive ? "+" : ""}
              {t.points} pts
            </span>
          </li>
        );
      })}
    </ul>
  );
}
