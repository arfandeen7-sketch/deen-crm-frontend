"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChartFrame } from "@/components/dashboard/charts/ChartFrame";
import { HorizontalBarChart } from "@/components/dashboard/charts/HorizontalBarChart";
import {
  SERIES,
  formatAed,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/charts/theme";
import type { SourcePerformanceRow } from "@/types";

type Metric = "revenue" | "leads" | "winRate";

const METRICS: Array<{ key: Metric; label: string }> = [
  { key: "revenue", label: "Revenue" },
  { key: "leads", label: "Volume" },
  { key: "winRate", label: "Win rate" },
];

/**
 * Channel ROI panel.
 *
 * Toggling between revenue, volume and win rate is the whole point: the channel
 * that sends the most leads is frequently not the one that closes them, and
 * seeing both rankings side by side is what drives spend decisions.
 */
export function SourcePerformancePanel({
  rows,
  loading,
  height = 260,
}: {
  rows: SourcePerformanceRow[] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const data = rows ?? [];

  const sorted = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 8);

  const chartData = sorted.map((row) => ({
    label: row.source,
    value: row[metric],
    meta:
      metric === "revenue"
        ? `${formatNumber(row.leads)} leads · ${formatPercent(row.winRate, 0)} win`
        : metric === "leads"
          ? `${formatPercent(row.touchRate, 0)} touched`
          : `${formatNumber(row.deals)} of ${formatNumber(row.leads)}`,
    color: metric === "revenue" ? SERIES.revenue : SERIES.ink,
  }));

  const formatter = (value: number) => {
    if (metric === "revenue") return formatAed(value, { compact: true });
    if (metric === "winRate") return formatPercent(value, 1);
    return formatNumber(value);
  };

  const hasRevenue = data.some((r) => r.revenue > 0);

  return (
    <ChartFrame
      title="Channel Performance"
      subtitle={
        metric === "revenue"
          ? "Revenue from leads acquired in this period"
          : metric === "leads"
            ? "Lead volume by source"
            : "Share of leads that reached Deal Closed"
      }
      height={height}
      loading={loading}
      isEmpty={sorted.length === 0}
      emptyMessage="No leads were acquired in this period"
      action={
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200/80 bg-white p-0.5">
          {METRICS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMetric(option.key)}
              aria-pressed={metric === option.key}
              className={cn(
                "cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                metric === option.key
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-full overflow-y-auto pr-1">
        <HorizontalBarChart
          data={chartData}
          valueFormatter={formatter}
          showRank
        />
        {metric === "revenue" && !hasRevenue && (
          <p className="mt-3 text-center text-[11px] text-zinc-400">
            No deals closed yet from leads acquired in this period — switch to
            Volume to compare intake.
          </p>
        )}
      </div>
    </ChartFrame>
  );
}
