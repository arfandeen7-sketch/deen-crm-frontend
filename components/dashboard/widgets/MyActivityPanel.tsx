"use client";

import { useMemo } from "react";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartFrame, ChartLegend } from "@/components/dashboard/charts/ChartFrame";
import { StackedBarChart } from "@/components/dashboard/charts/StackedBarChart";
import { Skeleton } from "@/components/ui/States";
import {
  SERIES,
  formatAed,
  formatBucketLabel,
  formatFullDate,
} from "@/components/dashboard/charts/theme";
import type { ActivityTrendPoint, PeerRank } from "@/types";

/**
 * Activity actions worth charting, in stacking order.
 *
 * `viewed` is intentionally excluded: opening a lead is not work, and including
 * it would let a rep look busy by scrolling their list.
 */
const ACTION_SERIES = [
  { key: "status_changed", label: "Status updates", color: SERIES.ink },
  { key: "comment_added", label: "Notes", color: SERIES.graphite },
  { key: "followup_scheduled", label: "Follow-ups set", color: SERIES.revenueSoft },
  { key: "followup_completed", label: "Follow-ups done", color: SERIES.revenue },
  { key: "field_updated", label: "Edits", color: SERIES.mist },
] as const;

export function MyActivityPanel({
  trend,
  loading,
  height = 240,
}: {
  trend: ActivityTrendPoint[] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const data = useMemo(() => {
    return (trend ?? []).map((point) => {
      const row: Record<string, string | number> = { bucket: point.bucket };
      let total = 0;
      for (const series of ACTION_SERIES) {
        const value = point.byAction[series.key] ?? 0;
        row[series.key] = value;
        total += value;
      }
      row.total = total;
      return row;
    });
  }, [trend]);

  const isEmpty = data.length === 0 || data.every((row) => row.total === 0);

  return (
    <ChartFrame
      title="My Activity"
      subtitle="Meaningful actions logged per day"
      height={height}
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage="No activity logged in the last two weeks"
      legend={<ChartLegend items={ACTION_SERIES.map((s) => ({ ...s }))} />}
    >
      <StackedBarChart
        data={data}
        series={ACTION_SERIES.map((s) => ({ ...s }))}
        xKey="bucket"
        xTickFormatter={(value) => formatBucketLabel(value, "day")}
        tooltipTitleFormatter={(label) => formatFullDate(String(label))}
      />
    </ChartFrame>
  );
}

/**
 * Standing within the immediate team.
 *
 * Deliberately shows the gap to the leader rather than a raw list of everyone —
 * it motivates without publishing a shame ranking on every rep's home screen.
 */
export function RankCard({
  rank,
  loading,
}: {
  rank: PeerRank | undefined;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  if (!rank || rank.total <= 1) return null;

  const gap = Math.max(0, rank.leaderRevenue - rank.myRevenue);
  const isLeader = rank.rank === 1 && rank.myRevenue > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-2xs",
        isLeader
          ? "border-teal-200/70 bg-teal-50/40"
          : "border-neutral-200/80 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Team standing
        </span>
        {isLeader && <Award className="h-4 w-4 text-teal-700" />}
      </div>

      <p className="mt-1 font-secondary text-3xl font-extrabold tracking-tight text-zinc-900">
        #{rank.rank}
        <span className="ml-1 text-base font-bold text-zinc-400">
          of {rank.total}
        </span>
      </p>

      <p className="mt-1 text-xs font-medium text-zinc-500">
        by revenue this period
      </p>

      {isLeader ? (
        <p className="mt-2 text-[11px] font-bold text-teal-700">
          Leading the team — keep it up
        </p>
      ) : gap > 0 ? (
        <p className="mt-2 text-[11px] text-zinc-400">
          {formatAed(gap, { compact: true })} behind the leader
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-zinc-400">
          Close your first deal this period to climb
        </p>
      )}
    </div>
  );
}
