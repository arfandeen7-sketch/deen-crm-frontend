"use client";

import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  secondary?: number;
}

export function BarChart({
  data,
  color = "bg-indigo-500",
  secondaryColor = "bg-indigo-200",
}: {
  data: BarDatum[];
  color?: string;
  secondaryColor?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)));

  if (data.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-slate-500" title={d.label}>
            {d.label}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full transition-all", color)}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            {d.secondary !== undefined && (
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", secondaryColor)}
                  style={{ width: `${(d.secondary / max) * 100}%` }}
                />
              </div>
            )}
          </div>
          <span className="w-8 text-right text-sm font-medium text-slate-700">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
