"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Gift, LayoutList, BarChart2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/today",   label: "Vandaag",  Icon: CheckSquare },
  { href: "/tasks",   label: "Taken",    Icon: LayoutList  },
  { href: "/rewards", label: "Beloningen", Icon: Gift },
  { href: "/stats",   label: "Stats",    Icon: BarChart2   },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors min-w-[64px] ${
              active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.75}
              className="transition-all"
            />
            <span className={`text-xs font-medium ${active ? "font-semibold" : ""}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
