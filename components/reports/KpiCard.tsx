"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import type { KpiComparisonValue } from "@/types";

const accents: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
};

/**
 * KPI card with a period-over-period trend indicator. When `comparison` is
 * omitted (no date range selected, so there's no "previous period"), only
 * the raw value is shown.
 */
export function KpiCard({
  label,
  value,
  suffix = "",
  icon: Icon,
  accent = "indigo",
  loading,
  comparison,
  invertTrend = false,
}: {
  label: string;
  value?: number | string;
  suffix?: string;
  icon: LucideIcon;
  accent?: keyof typeof accents;
  loading?: boolean;
  comparison?: KpiComparisonValue | null;
  /** Set true for metrics where a decrease is "good" (e.g. missed follow-ups). */
  invertTrend?: boolean;
}) {
  const delta = comparison?.deltaPct ?? null;
  const isUp = delta !== null && delta > 0.5;
  const isDown = delta !== null && delta < -0.5;
  const isGood = invertTrend ? isDown : isUp;
  const isBad = invertTrend ? isUp : isDown;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {value ?? 0}
              {suffix}
            </p>
          )}
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {!loading && delta !== null && (
        <div
          className={cn(
            "mt-3 flex items-center gap-1 text-xs font-medium",
            isGood && "text-emerald-600",
            isBad && "text-rose-600",
            !isGood && !isBad && "text-slate-400",
          )}
        >
          {isUp && <ArrowUp className="h-3.5 w-3.5" />}
          {isDown && <ArrowDown className="h-3.5 w-3.5" />}
          {!isUp && !isDown && <Minus className="h-3.5 w-3.5" />}
          <span>{Math.abs(delta).toFixed(1)}% vs previous period</span>
        </div>
      )}
    </div>
  );
}
