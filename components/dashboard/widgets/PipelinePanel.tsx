"use client";

import { ChartFrame, ChartLegend } from "@/components/dashboard/charts/ChartFrame";
import { PipelineFunnel } from "@/components/dashboard/charts/PipelineFunnel";
import { DonutBreakdown } from "@/components/dashboard/charts/DonutBreakdown";
import { statusColor } from "@/components/dashboard/charts/theme";
import type { FunnelStage } from "@/types";

/** Conversion funnel for leads acquired in the selected period. */
export function FunnelPanel({
  funnel,
  loading,
  height = 260,
  title = "Pipeline Conversion",
  subtitle = "Leads acquired in this period, by furthest stage reached",
}: {
  funnel: FunnelStage[] | undefined;
  loading?: boolean;
  height?: number;
  title?: string;
  subtitle?: string;
}) {
  const stages = funnel ?? [];
  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      height={height}
      loading={loading}
      isEmpty={stages.length === 0 || (stages[0]?.count ?? 0) === 0}
      emptyMessage="No leads entered the pipeline in this period"
    >
      <PipelineFunnel stages={stages} />
    </ChartFrame>
  );
}

/**
 * Current open-pipeline composition by status.
 *
 * Point-in-time, not period-scoped — "what is sitting in my pipeline right now"
 * is a different question from "what did this month bring in".
 */
export function StatusMixPanel({
  statusMix,
  loading,
  height = 260,
  title = "Pipeline by Status",
}: {
  statusMix: { status: string; count: number }[] | undefined;
  loading?: boolean;
  height?: number;
  title?: string;
}) {
  const rows = statusMix ?? [];
  const top = [...rows].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <ChartFrame
      title={title}
      subtitle="Every open lead, right now"
      height={height}
      loading={loading}
      isEmpty={rows.length === 0}
      emptyMessage="No leads in your pipeline yet"
      legend={
        <ChartLegend
          items={top.map((row, i) => ({
            label: row.status,
            color: statusColor(row.status, i),
            value: String(row.count),
          }))}
        />
      }
    >
      <DonutBreakdown
        centerLabel="leads"
        data={rows.map((row, i) => ({
          label: row.status,
          value: row.count,
          color: statusColor(row.status, i),
        }))}
      />
    </ChartFrame>
  );
}
