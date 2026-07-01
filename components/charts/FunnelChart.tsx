"use client";

import { cn } from "@/lib/utils";

export interface FunnelDatum {
  stage: string;
  count: number;
  percentage: number;
}

const COLORS = ["bg-indigo-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];

/**
 * Horizontal funnel visualization. NOTE: this is a snapshot-based
 * approximation built from current status counts — a true progression
 * funnel (leads that passed through each stage over time) requires backend
 * aggregation over lead status history.
 */
export function FunnelChart({ data }: { data: FunnelDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const widthPct = Math.max(8, (d.count / max) * 100);
        return (
          <div key={d.stage} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-slate-500" title={d.stage}>
              {d.stage}
            </span>
            <div className="flex-1">
              <div
                className={cn("flex h-8 items-center justify-end rounded-md px-2 text-xs font-medium text-white transition-all", COLORS[i % COLORS.length])}
                style={{ width: `${widthPct}%` }}
              >
                {d.count}
              </div>
            </div>
            <span className="w-12 text-right text-xs text-slate-400">
              {d.percentage.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
