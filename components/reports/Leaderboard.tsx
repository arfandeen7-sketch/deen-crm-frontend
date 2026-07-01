"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/Avatar";
import { SEMANTIC_COLORS } from "@/components/charts/palette";
import type { LeaderboardEntry } from "@/types";

const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-orange-600"];

export function Leaderboard({
  title,
  entries,
  suffix = "%",
  emptyLabel = "No data available.",
}: {
  title: string;
  entries: LeaderboardEntry[];
  suffix?: string;
  emptyLabel?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  const maxValue = Math.max(1, ...entries.map((e) => e.value));
  const isNeedsAttention = title.toLowerCase().includes("needs attention");
  const isMostImproved = title.toLowerCase().includes("improved");
  
  const barColor = isNeedsAttention ? "bg-rose-500" : isMostImproved ? "bg-emerald-500" : "bg-indigo-500";
  const bgBarColor = isNeedsAttention ? "bg-rose-100" : isMostImproved ? "bg-emerald-100" : "bg-indigo-100";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Trophy className="h-4 w-4 text-amber-500" /> {title}
      </h4>
      <ul className="space-y-3">
        {entries.map((e) => {
          const widthPct = Math.max(2, (e.value / maxValue) * 100);
          
          return (
            <li key={e.userId} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-5 shrink-0 text-center text-sm font-bold",
                  e.rank <= 3 ? MEDAL_COLORS[e.rank - 1] : "text-slate-400",
                )}
              >
                {e.rank}
              </span>
              <UserAvatar name={e.fullName} size="sm" />
              <span className="flex-1 truncate text-sm text-slate-700">{e.fullName}</span>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-semibold text-slate-900 leading-none">
                  {e.value.toFixed(suffix === "%" ? 1 : 0)}
                  {suffix}
                </span>
                <div className={cn("h-1.5 w-16 overflow-hidden rounded-full", bgBarColor)}>
                  <div
                    className={cn("h-full rounded-full transition-all", barColor)}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
