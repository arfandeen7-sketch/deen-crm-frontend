"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import { Sparkline, type SparklineDatum } from "@/components/charts/Sparkline";
import { SEMANTIC_COLORS } from "@/components/charts/palette";
import type { KpiComparisonValue } from "@/types";

const accents: Record<string, string> = {
  indigo: "bg-neutral-100 text-neutral-900",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-red-50 text-red-700",
  sky: "bg-sky-50 text-sky-700",
  violet: "bg-purple-50 text-purple-700",
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
  history,
}: {
  label: string;
  value?: number | string | null; // Allow null to represent missing data
  suffix?: string;
  icon: LucideIcon;
  accent?: keyof typeof accents;
  loading?: boolean;
  comparison?: KpiComparisonValue | null;
  /** Set true for metrics where a decrease is "good" (e.g. missed follow-ups). */
  invertTrend?: boolean;
  history?: SparklineDatum[];
}) {
  const delta = comparison?.deltaPct ?? null;
  const isUp = delta !== null && delta > 0.5;
  const isDown = delta !== null && delta < -0.5;
  const isGood = invertTrend ? isDown : isUp;
  const isBad = invertTrend ? isUp : isDown;

  // Determine value color based on thresholds
  let valueColor = "text-neutral-900";
  let statusText = "";
  if (typeof value === "number" || (typeof value === "string" && !isNaN(Number(value)))) {
    const numValue = Number(value);
    if (label === "Touch Rate") {
      if (numValue >= 50) { valueColor = "text-emerald-700"; statusText = "On target"; }
      else if (numValue >= 30) { valueColor = "text-amber-700"; statusText = "Borderline"; }
      else { valueColor = "text-red-700"; statusText = "Below target"; }
    } else if (label === "Conversion Rate") {
      if (numValue >= 20) { valueColor = "text-emerald-700"; statusText = "On target"; }
      else if (numValue >= 10) { valueColor = "text-amber-700"; statusText = "Borderline"; }
      else { valueColor = "text-red-700"; statusText = "Below target"; }
    } else if (label === "Follow-up Completion") {
      if (numValue >= 80) { valueColor = "text-emerald-700"; statusText = "On target"; }
      else if (numValue >= 50) { valueColor = "text-amber-700"; statusText = "Borderline"; }
      else { valueColor = "text-red-700"; statusText = "Below target"; }
    } else if (label === "Avg. Response Time") {
      if (numValue <= 30) { valueColor = "text-emerald-700"; statusText = "Excellent"; }
      else if (numValue <= 120) { valueColor = "text-amber-700"; statusText = "Acceptable"; }
      else { valueColor = "text-red-700"; statusText = "Needs improvement"; }
    }
  }

  const hasValue = value !== null && value !== undefined && value !== "—";

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : hasValue ? (
              <div className="flex items-baseline gap-2">
                <p className={cn("mt-1 text-2xl font-bold tracking-tight", valueColor)}>
                  {value}
                  {suffix}
                </p>
                {statusText && (
                  <span className={cn("text-xs font-medium", valueColor)}>
                    ({statusText})
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs font-medium text-neutral-400">
                Not enough data yet
              </p>
            )}
          </div>
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200/60 shadow-2xs", accents[accent])}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        </div>
        
        {!loading && delta !== null && hasValue && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1 text-xs font-medium",
              isGood && "text-emerald-700",
              isBad && "text-red-700",
              !isGood && !isBad && "text-neutral-400",
            )}
          >
            {isUp && <ArrowUp className="h-3.5 w-3.5" />}
            {isDown && <ArrowDown className="h-3.5 w-3.5" />}
            {!isUp && !isDown && <Minus className="h-3.5 w-3.5" />}
            <span>{Math.abs(delta).toFixed(1)}% vs previous period</span>
          </div>
        )}
      </div>

      {!loading && history && history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
          <Sparkline 
            data={history} 
            color={
              valueColor.includes("emerald") ? SEMANTIC_COLORS.success : 
              valueColor.includes("rose") || valueColor.includes("red") ? SEMANTIC_COLORS.danger : 
              valueColor.includes("amber") ? SEMANTIC_COLORS.warning : 
              "#171717"
            } 
            className="w-full justify-between"
          />
        </div>
      )}
    </div>
  );
}
