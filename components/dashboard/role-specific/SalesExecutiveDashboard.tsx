"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { UserAvatar } from "@/components/ui/Avatar";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { cn, formatDate } from "@/lib/utils";
import {
  useDashboardSummary,
  useTodayFollowupCount,
  useMissedFollowupCount,
} from "@/hooks/useDashboard";
import { useFollowup } from "@/hooks/useFollowup";
import { useUpcomingFollowupCount } from "@/hooks/useDashboard";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { LEAD_STATUS_COLORS } from "@/constants";

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

export function SalesExecutiveDashboard() {
  const summary = useDashboardSummary();
  const todayCount = useTodayFollowupCount();
  const missedCount = useMissedFollowupCount();
  const upcomingCount = useUpcomingFollowupCount();

  const todayFollowups = useFollowup("today", { page: 1, pageSize: 5 });
  const missedFollowups = useFollowup("missed", { page: 1, pageSize: 3 });

  const todayList = todayFollowups.data?.data ?? [];
  const missedList = missedFollowups.data?.data ?? [];
  const quickActions = ROLE_QUICK_ACTIONS.sales_executive;

  return (
    <div className="space-y-4 font-sans pb-12">
      {/* ── Top Stat Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-neutral-200/80 pb-8 border-b border-neutral-200/80">
        <div className="flex flex-col justify-between pt-2 pb-4 pr-6 md:pl-0 md:pr-6 relative h-36">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">My Leads</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {summary.isLoading ? "..." : (summary.data?.totalLeads ?? 0)}
            </div>
          </div>
          <div className="h-1 bg-black absolute bottom-0 left-0 right-0 md:left-0 md:right-6 rounded-full" />
        </div>

        <Link href="/followup/today" className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Today&apos;s Follow-ups</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {todayCount.isLoading ? "..." : (todayCount.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-emerald-600 absolute bottom-0 left-6 right-6 rounded-full" />
        </Link>

        <Link href="/followup/missed" className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Missed Follow-ups</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {missedCount.isLoading ? "..." : (missedCount.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-red-600 absolute bottom-0 left-6 right-6 rounded-full" />
        </Link>

        <Link href="/followup/upcoming" className="flex flex-col justify-between pt-2 pb-4 pl-6 pr-0 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Upcoming Follow-ups</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {upcomingCount.isLoading ? "..." : (upcomingCount.data ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-amber-500 absolute bottom-0 left-6 right-0 rounded-full" />
        </Link>
      </div>

      {/* ── Split Section 1: My Follow-ups Today & Attendance Check-In ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-b border-zinc-200">
        {/* My Follow-ups Today (left, 2/3) */}
        <div className="lg:col-span-2 flex flex-col min-h-[340px] pr-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">My Follow-ups Today</h3>
              <p className="text-xs text-zinc-400 mt-1">Leads to follow up today</p>
            </div>
            <Link href="/followup/today" className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors">
              View all
            </Link>
          </div>

          <div className="mt-4 flex-1 divide-y divide-zinc-100">
            {todayFollowups.isLoading ? (
              <LoadingState />
            ) : todayList.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <EmptyState title="No follow-ups today" message="You're all caught up! 🎉" />
              </div>
            ) : (
              todayList.slice(0, 5).map((lead) => {
                const { day, month } = formatFollowUpDate(lead.followUpDate);
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
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatDate(lead.followUpDate)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide",
                        LEAD_STATUS_COLORS[lead.leadStatus] ?? "bg-zinc-100 text-zinc-600"
                      )}>
                        {lead.leadStatus}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-zinc-50 border border-zinc-100 rounded-2xl w-14 h-14 shrink-0 text-zinc-600">
                      <span className="text-xl font-extrabold leading-none">{day}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">{month}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance Check-In Widget (right, 1/3) */}
        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary mb-4">Attendance</h3>
          </div>
          <div className="flex-1">
            <AttendanceCheckInOut />
          </div>
        </div>
      </div>

      {/* ── Split Section 2: Missed Follow-ups Alert & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8">
        {/* Missed Follow-ups Alert (left, 2/3) */}
        <div className="lg:col-span-2 flex flex-col min-h-[340px] pr-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Missed Follow-ups</h3>
                <p className="text-xs text-zinc-400 mt-1">Overdue follow-ups need attention</p>
              </div>
            </div>
            <Link href="/followup/missed" className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors">
              View all
            </Link>
          </div>

          <div className="mt-4 flex-1 divide-y divide-zinc-100">
            {missedFollowups.isLoading ? (
              <LoadingState />
            ) : missedList.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <EmptyState title="No missed follow-ups" message="Great job staying on track! 🎉" />
              </div>
            ) : (
              missedList.slice(0, 3).map((lead) => {
                const { day, month } = formatFollowUpDate(lead.followUpDate);
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
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Due: {formatDate(lead.followUpDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-rose-50 border border-rose-100/50 rounded-2xl w-14 h-14 shrink-0 text-red-500">
                      <span className="text-xl font-extrabold leading-none">{day}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">{month}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions (right, 1/3) */}
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
