"use client";

import Link from "next/link";
import {
  Users2,
  UserPlus,
  Upload,
  Handshake,
  Briefcase,
  BarChart2,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { DonutChart } from "@/components/charts/DonutChart";
import { UserAvatar } from "@/components/ui/Avatar";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { timeAgo, cn } from "@/lib/utils";
import {
  useDashboardSummary,
  useRecentLeads,
  useStatusCount,
  useLeadCategoryCount,
} from "@/hooks/useDashboard";
import { useFollowup } from "@/hooks/useFollowup";
import { CHART_COLORS } from "@/components/charts/palette";

const QUICK_ACTIONS = [
  { label: "Create Lead", href: "/leads/create", icon: UserPlus, accent: "text-gray-900 bg-indigo-50" },
  { label: "Import Leads", href: "/leads/import", icon: Upload, accent: "text-emerald-600 bg-emerald-50" },
  { label: "Lead Reports", href: "/leads/reports", icon: BarChart2, accent: "text-sky-600 bg-sky-50" },
  { label: "Add Broker", href: "/brokers/create", icon: Handshake, accent: "text-amber-600 bg-amber-50" },
  { label: "Add Candidate", href: "/hrms/employees/create", icon: Briefcase, accent: "text-violet-600 bg-violet-50" },
];

function formatFollowUpDate(dateStr?: string | null): { day: string; month: string } {
  if (!dateStr) return { day: "--", month: "---" };
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    if (isNaN(d.getTime())) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const monthIndex = parseInt(parts[1], 10) - 1;
        return { day, month: months[monthIndex] || "---" };
      }
      return { day: "--", month: "---" };
    }
    const day = d.getDate().toString().padStart(2, "0");
    const month = months[d.getMonth()];
    return { day, month };
  } catch {
    return { day: "--", month: "---" };
  }
}

export default function DashboardOverviewPage() {
  const summary = useDashboardSummary();
  const recent = useRecentLeads();
  const interested = useStatusCount("Interested");
  const untouched = useLeadCategoryCount("untouched");
  const unassigned = useLeadCategoryCount("unassigned");
  const missedFollowupsQuery = useFollowup("missed", { page: 1, pageSize: 3 });

  const missedList = missedFollowupsQuery.data?.data ?? [];
  const sourceCounts = summary.data?.sourceCounts ?? [];
  const totalSourceLeads = sourceCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4 font-sans pb-12">
      {/* ── Top Stat Strip (Row of 4 Stats matching the screenshot, divided by gray lines) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-zinc-200 pb-8 border-b border-zinc-200">
        {/* Total Leads */}
        <div className="flex flex-col justify-between pt-2 pb-4 pr-6 md:pl-0 md:pr-6 relative h-36">
          <div className="flex-1">
            <span className="text-sm font-semibold text-zinc-400">Total Leads</span>
            <div className="text-5xl font-bold text-zinc-900 mt-2 font-secondary tracking-tight">
              {summary.isLoading ? "..." : (summary.data?.totalLeads ?? 0)}
            </div>
          </div>
          <div className="h-1.5 bg-zinc-950 absolute bottom-0 left-0 right-0 md:left-0 md:right-6" />
        </div>

        {/* Untouched Leads */}
        <Link href="/leads/untouched" className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36 hover:bg-zinc-50/45 transition-colors">
          <div className="flex-1">
            <span className="text-sm font-semibold text-zinc-400 font-secondary">Untouched Leads</span>
            <div className="text-5xl font-bold text-zinc-900 mt-2 font-secondary tracking-tight">
              {untouched.isLoading ? "..." : (untouched.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1.5 bg-amber-400 absolute bottom-0 left-6 right-6" />
        </Link>

        {/* Interested */}
        <div className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36">
          <div className="flex-1">
            <span className="text-sm font-semibold text-zinc-400 font-secondary">Interested</span>
            <div className="text-5xl font-bold text-zinc-900 mt-2 font-secondary tracking-tight">
              {interested.isLoading ? "..." : (interested.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1.5 bg-emerald-600 absolute bottom-0 left-6 right-6" />
        </div>

        {/* Unassigned Leads */}
        <Link href="/leads/unassigned" className="flex flex-col justify-between pt-2 pb-4 pl-6 pr-0 relative h-36 hover:bg-zinc-50/45 transition-colors">
          <div className="flex-1">
            <span className="text-sm font-semibold text-zinc-400 font-secondary">Unassigned Leads</span>
            <div className="text-5xl font-bold text-zinc-900 mt-2 font-secondary tracking-tight">
              {unassigned.isLoading ? "..." : (unassigned.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1.5 bg-red-600 absolute bottom-0 left-6 right-0" />
        </Link>
      </div>

      {/* ── Split Section 1: Leads By Source & Missed Follow-ups ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-b border-zinc-200">
        {/* Leads By Source Section */}
        <div className="lg:col-span-2 flex flex-col justify-between min-h-[340px] pr-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Leads By Source</h3>
            <p className="text-xs text-zinc-400 mt-1">Distribution across ingestion sources</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-8 flex-1">
            {summary.isLoading ? (
              <div className="flex-1 flex justify-center"><LoadingState /></div>
            ) : (
              <>
                {/* SVG Donut Chart */}
                <div className="shrink-0 flex justify-center w-full sm:w-auto">
                  <DonutChart
                    showLegend={false}
                    data={sourceCounts.map((s) => ({
                      label: s.source,
                      value: s.count,
                    }))}
                  />
                </div>

                {/* Custom Source Legend matching the screenshot progress bars */}
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

        {/* Missed Follow-ups Section */}
        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Missed Follow-Ups</h3>
            <p className="text-xs text-zinc-400 mt-1">Follow-Ups waiting for review</p>
          </div>

          <div className="mt-4 flex-1 divide-y divide-zinc-100">
            {missedFollowupsQuery.isLoading ? (
              <LoadingState />
            ) : missedList.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <EmptyState title="No missed follow-ups" message="Awesome job staying on track! 🎉" />
              </div>
            ) : (
              missedList.slice(0, 3).map((lead) => {
                const { day, month } = formatFollowUpDate(lead.followUpDate);
                return (
                  <div key={lead.id} className="flex items-center justify-between py-4.5 first:pt-2 last:pb-0">
                    <div className="min-w-0 flex-1 pr-4">
                      <h4 className="text-base font-bold text-zinc-900 truncate font-secondary">
                        {lead.leadName}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Assigned to: <span className="text-zinc-600 font-semibold">{lead.assignedUser?.fullName ?? "Unassigned"}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-rose-50 border border-rose-100/50 rounded-2xl w-14 h-14 shrink-0 text-red-500">
                      <span className="text-xl font-extrabold leading-none">{day}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">{month}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Split Section 2: Recent Leads & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8">
        {/* Recent Leads Section */}
        <div className="lg:col-span-2 flex flex-col justify-between min-h-[340px] pr-4">
          <div>
            <div className="flex justify-between items-center pb-4">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Recent Leads</h3>
                <p className="text-xs text-zinc-400 mt-1">Latest leads first</p>
              </div>
              <Link href="/leads" className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors">
                View all
              </Link>
            </div>

            <div className="mt-4 divide-y divide-zinc-100">
              {recent.isLoading ? (
                <LoadingState />
              ) : (recent.data?.data.length ?? 0) === 0 ? (
                <EmptyState title="No leads yet" message="New leads will appear here." />
              ) : (
                recent.data?.data.slice(0, 4).map((lead) => {
                  const timeText = timeAgo(lead.createdAt);
                  const dateFormatted = new Date(lead.createdAt).toLocaleDateString("en-GB");
                  return (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-4 py-3.5 hover:bg-zinc-50/50 px-2 rounded-2xl transition-colors group"
                    >
                      <UserAvatar name={lead.leadName} size="sm" className="w-10 h-10 shrink-0 ring-2 ring-zinc-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate font-secondary group-hover:text-zinc-950">
                          {lead.leadName}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">{timeText}</p>
                      </div>
                      <div className="shrink-0">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide",
                          lead.leadStatus === "Fresh" ? "bg-sky-100 text-sky-700" :
                          lead.leadStatus === "Interested" ? "bg-emerald-100 text-emerald-700" :
                          lead.leadStatus === "Cold" ? "bg-blue-100 text-blue-700" :
                          "bg-zinc-100 text-zinc-600"
                        )}>
                          {lead.leadStatus}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-zinc-400 w-24 text-right">
                        {dateFormatted}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Quick Actions</h3>
            <p className="text-xs text-zinc-400 mt-1">Frequent tools</p>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-center space-y-3">
            {QUICK_ACTIONS.map((a) => (
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
