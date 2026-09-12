"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import { PanelHeading } from "./DashboardShell";
import {
  formatAed,
  formatHours,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/charts/theme";
import type { TeamPerformanceRow } from "@/types";

type SortKey = "revenue" | "deals" | "leadsAssigned" | "touchRate" | "missedFollowups";

const COLUMNS: Array<{
  key: SortKey;
  label: string;
  align: "right";
  format: (row: TeamPerformanceRow) => string;
  /** Highlights the value when it signals a problem. */
  tone?: (row: TeamPerformanceRow) => string | undefined;
}> = [
  {
    key: "leadsAssigned",
    label: "Assigned",
    align: "right",
    format: (r) => formatNumber(r.leadsAssigned),
  },
  {
    key: "touchRate",
    label: "Touched",
    align: "right",
    format: (r) => (r.leadsAssigned > 0 ? formatPercent(r.touchRate, 0) : "—"),
    tone: (r) =>
      r.leadsAssigned > 0 && r.touchRate < 60 ? "text-amber-700" : undefined,
  },
  {
    key: "missedFollowups",
    label: "Missed",
    align: "right",
    format: (r) => formatNumber(r.missedFollowups),
    tone: (r) => (r.missedFollowups > 0 ? "text-red-700" : "text-zinc-300"),
  },
  {
    key: "deals",
    label: "Deals",
    align: "right",
    format: (r) => formatNumber(r.deals),
  },
  {
    key: "revenue",
    label: "Revenue",
    align: "right",
    format: (r) => (r.revenue > 0 ? formatAed(r.revenue, { compact: true }) : "—"),
  },
];

/**
 * Sortable performance table.
 *
 * Sorted by revenue by default, but the diagnostic columns (touch rate, missed
 * follow-ups) are sortable too, because "who is falling behind" is asked as often
 * as "who is winning".
 */
export function TeamLeaderboard({
  rows,
  loading,
  title = "Team Performance",
  subtitle,
  maxRows,
}: {
  rows: TeamPerformanceRow[] | undefined;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  maxRows?: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");

  const sorted = useMemo(() => {
    const list = [...(rows ?? [])];
    // Missed follow-ups is the one column where "more" is worse, so it sorts
    // descending too — the worst offender should surface first either way.
    list.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
    return maxRows ? list.slice(0, maxRows) : list;
  }, [rows, sortKey, maxRows]);

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeading title={title} subtitle={subtitle} />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeading title={title} subtitle={subtitle} />
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 py-10">
          <p className="text-xs font-medium text-zinc-400">
            No sales people in scope yet
          </p>
        </div>
      </div>
    );
  }

  const topRevenue = Math.max(...sorted.map((r) => r.revenue), 1);

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title={title}
        subtitle={subtitle ?? `Sorted by ${sortKey === "revenue" ? "revenue" : sortKey}`}
      />

      <div className="mt-4 -mx-1 overflow-x-auto">
        <table className="w-full min-w-xl border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="px-2 pb-2 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Rep
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-2 pb-2 text-right">
                  <button
                    type="button"
                    onClick={() => setSortKey(col.key)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                      sortKey === col.key
                        ? "text-zinc-900"
                        : "text-zinc-400 hover:text-zinc-700",
                    )}
                  >
                    {col.label}
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.userId} className="group">
                <td className="border-t border-zinc-100 px-2 py-2.5">
                  <Link
                    href={`/leads/reports/employee/${row.userId}`}
                    className="flex items-center gap-2"
                  >
                    <span className="w-4 shrink-0 font-secondary text-[11px] font-bold tabular-nums text-zinc-300">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-zinc-800 transition-colors group-hover:text-black">
                        {row.fullName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-10 overflow-hidden rounded-full bg-zinc-100">
                          <span
                            className="block h-full rounded-full bg-teal-700"
                            style={{
                              width: `${Math.min(100, (row.revenue / topRevenue) * 100)}%`,
                            }}
                          />
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {row.avgFirstResponseHours != null
                            ? `${formatHours(row.avgFirstResponseHours)} response`
                            : "no response data"}
                        </span>
                      </span>
                    </span>
                  </Link>
                </td>

                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="border-t border-zinc-100 px-2 py-2.5 text-right"
                  >
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        col.tone?.(row) ?? "text-zinc-700",
                      )}
                    >
                      {col.format(row)}
                    </span>
                    {col.key === "revenue" && row.revenueProgress != null && (
                      <span
                        className={cn(
                          "block text-[10px] font-medium tabular-nums",
                          row.revenueProgress >= 100
                            ? "text-teal-700"
                            : "text-zinc-400",
                        )}
                      >
                        {formatPercent(row.revenueProgress, 0)} of target
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
