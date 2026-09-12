"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChartFrame, ChartLegend } from "@/components/dashboard/charts/ChartFrame";
import { AreaTrendChart } from "@/components/dashboard/charts/AreaTrendChart";
import { ComboBarLineChart } from "@/components/dashboard/charts/ComboBarLineChart";
import { SERIES, formatAed, formatNumber } from "@/components/dashboard/charts/theme";
import type { ChartGranularity, TrendPoint } from "@/types";

type View = "revenue" | "leads";

/**
 * Primary trend chart.
 *
 * Revenue view pairs money (bars) with deal count (line) so a spike caused by
 * one large deal is visually distinguishable from a genuinely busy month.
 */
export function RevenueTrendPanel({
  trend,
  granularity = "day",
  loading,
  height = 280,
  action,
}: {
  trend: TrendPoint[] | undefined;
  granularity?: ChartGranularity;
  loading?: boolean;
  height?: number;
  action?: React.ReactNode;
}) {
  const [view, setView] = useState<View>("revenue");
  const data = trend ?? [];

  const isEmpty =
    data.length === 0 ||
    (view === "revenue"
      ? data.every((p) => p.revenue === 0 && p.deals === 0)
      : data.every((p) => p.leads === 0));

  return (
    <ChartFrame
      title={view === "revenue" ? "Revenue & Deals" : "Lead Acquisition"}
      subtitle={
        view === "revenue"
          ? "Closed value with deal count overlaid"
          : "New leads entering the system"
      }
      height={height}
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage={
        view === "revenue"
          ? "No deals closed in this period"
          : "No leads created in this period"
      }
      legend={
        view === "revenue" ? (
          <ChartLegend
            items={[
              { label: "Revenue (AED)", color: SERIES.revenue },
              { label: "Deals closed", color: SERIES.ink },
            ]}
          />
        ) : undefined
      }
      action={
        <div className="flex items-center gap-2">
          {action}
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200/80 bg-white p-0.5">
            {(["revenue", "leads"] as View[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                  view === option
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100",
                )}
              >
                {option === "revenue" ? "Revenue" : "Leads"}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {view === "revenue" ? (
        <ComboBarLineChart
          data={data}
          barKey="revenue"
          barLabel="Revenue"
          lineKey="deals"
          lineLabel="Deals closed"
          granularity={granularity}
        />
      ) : (
        <AreaTrendChart
          data={data}
          granularity={granularity}
          series={[
            {
              key: "leads",
              label: "New leads",
              color: SERIES.ink,
              format: formatNumber,
            },
          ]}
        />
      )}
    </ChartFrame>
  );
}

/** Compact revenue-only area chart for narrower slots. */
export function RevenueSparkPanel({
  trend,
  granularity = "day",
  loading,
  height = 200,
  title = "Revenue Trend",
}: {
  trend: TrendPoint[] | undefined;
  granularity?: ChartGranularity;
  loading?: boolean;
  height?: number;
  title?: string;
}) {
  const data = trend ?? [];
  return (
    <ChartFrame
      title={title}
      subtitle="Closed value over time"
      height={height}
      loading={loading}
      isEmpty={data.length === 0 || data.every((p) => p.revenue === 0)}
      emptyMessage="No revenue recorded in this period"
    >
      <AreaTrendChart
        data={data}
        granularity={granularity}
        yAxisWidth={44}
        series={[
          {
            key: "revenue",
            label: "Revenue",
            color: SERIES.revenue,
            format: (v) => formatAed(v),
          },
        ]}
      />
    </ChartFrame>
  );
}
