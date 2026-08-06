"use client";

import Link from "next/link";
import { DonutChart } from "@/components/charts/DonutChart";
import { LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/utils";
import {
  useDashboardSummary,
  useLeadCategoryCount,
} from "@/hooks/useDashboard";
import { CHART_COLORS } from "@/components/charts/palette";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { EmployeeActivitySection } from "@/components/dashboard/EmployeeActivitySection";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { FollowUpsWidget } from "@/components/dashboard/FollowUpsWidget";

export function MasterDashboard() {
  const summary = useDashboardSummary();
  const untouched = useLeadCategoryCount("untouched");
  const unassigned = useLeadCategoryCount("unassigned");

  const sourceCounts = summary.data?.sourceCounts ?? [];
  const totalSourceLeads = sourceCounts.reduce((sum, s) => sum + s.count, 0);
  const quickActions = ROLE_QUICK_ACTIONS.master;

  return (
    <div className="space-y-4 font-sans pb-12">
      {/* ── Top Stat Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-neutral-200/80 pb-8 border-b border-neutral-200/80">
        <div className="flex flex-col justify-between pt-2 pb-4 pr-6 md:pl-0 md:pr-6 relative h-36">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Leads</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {summary.isLoading ? "..." : (summary.data?.totalLeads ?? 0)}
            </div>
          </div>
          <div className="h-1 bg-black absolute bottom-0 left-0 right-0 md:left-0 md:right-6 rounded-full" />
        </div>

        <Link href="/leads/untouched" className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Untouched Leads</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {untouched.isLoading ? "..." : (untouched.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-amber-500 absolute bottom-0 left-6 right-6 rounded-full" />
        </Link>

        <div className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Deals Closed</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {summary.isLoading ? "..." : (summary.data?.dealsClosed ?? 0).toString().padStart(2, "0")}
            </div>
            <p className="mt-1 text-xs font-medium text-teal-700">
              AED {summary.isLoading ? "…" : Math.round(summary.data?.salesAmount ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="h-1 bg-teal-600 absolute bottom-0 left-6 right-6 rounded-full" />
        </div>

        <Link href="/leads/unassigned" className="flex flex-col justify-between pt-2 pb-4 pl-6 pr-0 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Unassigned Leads</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {unassigned.isLoading ? "..." : (unassigned.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-red-600 absolute bottom-0 left-6 right-0 rounded-full" />
        </Link>
      </div>

      {/* ── Recent Leads (2/3) & Missed Follow-ups (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-b border-zinc-200">
        <div className="lg:col-span-2">
          <RecentLeadsTable />
        </div>

        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <FollowUpsWidget />
        </div>
      </div>

      {/* ── Employee Activity Section ── */}
      <EmployeeActivitySection showLeadData={true} />

      {/* ── Leads By Source (2/3) & Quick Actions (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-t border-zinc-200">
        <div className="lg:col-span-2 flex flex-col justify-between min-h-85 pr-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Leads By Source</h3>
            <p className="text-xs text-zinc-400 mt-1">Distribution across ingestion sources</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-8 flex-1">
            {summary.isLoading ? (
              <div className="flex-1 flex justify-center"><LoadingState /></div>
            ) : (
              <>
                <div className="shrink-0 flex justify-center w-full sm:w-auto">
                  <DonutChart
                    showLegend={false}
                    data={sourceCounts.map((s) => ({
                      label: s.source,
                      value: s.count,
                    }))}
                  />
                </div>

                <div className="flex-1 w-full space-y-4 max-w-md">
                  {sourceCounts.map((s, i) => {
                    const pct = totalSourceLeads > 0 ? Math.round((s.count / totalSourceLeads) * 100) : 0;
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <div key={s.source} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-zinc-700">
                          <span className="font-secondary text-zinc-500">{s.source}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: color,
                              width: `${pct}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {sourceCounts.length === 0 && (
                    <p className="text-sm text-zinc-400 text-center py-4">No sources recorded</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Quick Actions</h3>
            <p className="text-xs text-zinc-400 mt-1">Frequent tools</p>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-center space-y-3">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 p-3.5 bg-white hover:bg-zinc-50/50 hover:border-zinc-300 transition-all shadow-sm group"
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105", a.accent)}>
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-zinc-700 font-secondary transition-colors group-hover:text-zinc-900">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
