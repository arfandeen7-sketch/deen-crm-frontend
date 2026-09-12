"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/States";
import { PanelHeading } from "./DashboardShell";
import { formatAed } from "@/components/dashboard/charts/theme";
import type { AnalyticsRecentDeal } from "@/types";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/** Latest closed deals — the social-proof feed that makes a good month visible. */
export function RecentDealsFeed({
  deals,
  loading,
  showEmployee = true,
}: {
  deals: AnalyticsRecentDeal[] | undefined;
  loading?: boolean;
  showEmployee?: boolean;
}) {
  const rows = deals ?? [];

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title="Latest Deals"
        subtitle="Most recently closed"
        href="/leads/deal-closed"
      />

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 p-6 text-center">
            <Trophy className="h-5 w-5 text-zinc-300" />
            <p className="text-xs font-medium text-zinc-500">No deals closed yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {rows.map((deal) => (
              <li key={deal.id}>
                <Link
                  href={`/leads/${deal.leadId}`}
                  className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-zinc-50/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold text-zinc-800">
                      {deal.leadName}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-400">
                      {showEmployee ? `${deal.employeeName} · ` : ""}
                      {deal.source}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-secondary text-xs font-bold tabular-nums text-teal-700">
                      {formatAed(deal.amount, { compact: deal.amount >= 1_000_000 })}
                    </span>
                    <span className="block text-[10px] text-zinc-400">
                      {relativeTime(deal.closedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
