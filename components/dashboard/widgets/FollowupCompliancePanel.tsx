"use client";

import { ChartFrame, ChartLegend } from "@/components/dashboard/charts/ChartFrame";
import { StackedBarChart } from "@/components/dashboard/charts/StackedBarChart";
import { SERIES } from "@/components/dashboard/charts/theme";
import type { TeamPerformanceRow } from "@/types";

const SERIES_DEF = [
  { key: "missed", label: "Missed", color: SERIES.negativeSoft },
  { key: "today", label: "Due today", color: SERIES.riskSoft },
  { key: "untouched", label: "Never touched", color: SERIES.mist },
];

/** Shortens a full name to "First L." so the category axis stays narrow. */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Follow-up hygiene per rep.
 *
 * Stacked rather than three separate charts because the useful signal is the
 * total size of a rep's backlog, with the split explaining what kind of debt it is.
 */
export function FollowupCompliancePanel({
  rows,
  loading,
  height = 260,
}: {
  rows: TeamPerformanceRow[] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const data = (rows ?? [])
    .map((row) => ({
      name: shortName(row.fullName),
      missed: row.missedFollowups,
      today: row.followupsToday,
      untouched: row.untouched,
      total: row.missedFollowups + row.followupsToday + row.untouched,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.missed - a.missed || b.total - a.total)
    .slice(0, 8);

  return (
    <ChartFrame
      title="Follow-up Hygiene"
      subtitle="Outstanding work per rep, worst first"
      height={height}
      loading={loading}
      isEmpty={data.length === 0}
      emptyMessage="Nothing outstanding — the team is caught up"
      legend={<ChartLegend items={SERIES_DEF} />}
    >
      <StackedBarChart
        data={data}
        series={SERIES_DEF}
        xKey="name"
        layout="vertical"
        tooltipTitleFormatter={(label) => String(label ?? "")}
      />
    </ChartFrame>
  );
}
