"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useDashboardSummary,
  useTodayFollowupCount,
  useMissedFollowupCount,
  useUpcomingFollowupCount,
} from "@/hooks/useDashboard";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { FollowUpsWidget } from "@/components/dashboard/FollowUpsWidget";

export function SalesExecutiveDashboard() {
  const summary = useDashboardSummary();
  const todayCount = useTodayFollowupCount();
  const missedCount = useMissedFollowupCount();
  const upcomingCount = useUpcomingFollowupCount();
  const { user } = useAuth();

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

      {/* ── Recent Leads (assigned to me, 2/3) & Missed Follow-ups (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-b border-zinc-200">
        <div className="lg:col-span-2">
          <RecentLeadsTable
            assignedTo={user?.id}
            title="My Recent Leads"
            subtitle="Latest leads assigned to you"
            viewAllHref="/leads/assigned"
          />
        </div>

        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <FollowUpsWidget
            subtitle="Overdue follow-ups need attention"
            emptyMessage="Great job staying on track! 🎉"
            showAssignedTo={false}
          />
        </div>
      </div>

      {/* ── Attendance & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-8 border-t border-zinc-200">
        <div className="flex flex-col">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary mb-4">Attendance</h3>
          </div>
          <div className="flex-1">
            <AttendanceCheckInOut />
          </div>
        </div>

        <div className="flex flex-col lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
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
