"use client";

import { cn } from "@/lib/utils";

export interface FunnelDatum {
  stage: string;
  count: number;
  percentage: number;
}

// Single sequential color ramp (lightest to darkest)
const COLORS = [
  "bg-indigo-200 text-indigo-900",
  "bg-indigo-300 text-indigo-950",
  "bg-indigo-400 text-white",
  "bg-indigo-500 text-white",
  "bg-indigo-600 text-white",
  "bg-indigo-700 text-white",
  "bg-indigo-800 text-white",
];

/**
 * Horizontal funnel visualization. NOTE: this is a snapshot-based
 * approximation built from current status counts.
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
        // Use square root scale relative to max to ensure small values remain visible
        const scaledWidth = (Math.sqrt(d.count) / Math.sqrt(max)) * 100;
        const widthPct = Math.max(8, scaledWidth);
        const colorClass = COLORS[Math.min(i, COLORS.length - 1)];

        return (
          <div key={d.stage} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs text-slate-500" title={d.stage}>
              {d.stage}
            </span>
            <div className="flex-1">
              <div
                className={cn(
                  "flex h-8 items-center justify-end rounded-md px-2 text-xs font-medium transition-all",
                  colorClass
                )}
                style={{ width: `${widthPct}%` }}
              >
                {d.count}
              </div>
            </div>
            <span className="w-12 text-right text-xs font-medium text-slate-500">
              {d.percentage.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
