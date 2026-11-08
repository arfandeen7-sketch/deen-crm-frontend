"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useDashboardSummary,
  useTodayFollowupCount,
  useMissedFollowupCount,
} from "@/hooks/useDashboard";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { FollowUpsWidget } from "@/components/dashboard/FollowUpsWidget";
import { TodoListWidget } from "@/components/dashboard/TodoListWidget";
import { LeadMetricsBand, PaperBand, StatArrow } from "@/components/dashboard/PaperBand";

export function SalesExecutiveDashboard() {
  const summary = useDashboardSummary();
  const todayCount = useTodayFollowupCount();
  const missedCount = useMissedFollowupCount();
  const { user } = useAuth();

  const quickActions = ROLE_QUICK_ACTIONS.sales_executive;

  return (
    <div className="space-y-4 font-sans pb-12">
      <PaperBand cols={4}>
        <StatArrow index={0} label="My leads" caption="Assigned to you" value={summary.data?.totalLeads ?? 0} loading={summary.isLoading} href="/leads/assigned" />
        <StatArrow index={1} label="Today's follow-ups" caption="Due before midnight" value={todayCount.data ?? 0} pad={2} loading={todayCount.isLoading} href="/followup/today" />
        <StatArrow index={2} label="Missed follow-ups" caption="Waiting for a reply" value={missedCount.data ?? 0} pad={2} loading={missedCount.isLoading} href="/followup/missed" />
        <StatArrow index={3} label="Deals closed" caption="Total sales value in AED" value={Math.round(summary.data?.salesAmount ?? 0)} prefix="AED" loading={summary.isLoading} href="/leads/deal-closed" />
      </PaperBand>

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

      {/* ── My Todos ── */}
      <div className="py-8 border-t border-zinc-200">
        <TodoListWidget />
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
