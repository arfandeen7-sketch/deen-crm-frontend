"use client";

import Link from "next/link";
import { Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDashboardSummary,
  useLeadCategoryCount,
} from "@/hooks/useDashboard";
import { useMyTeam } from "@/hooks/useTeams";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { FollowUpsWidget } from "@/components/dashboard/FollowUpsWidget";
import { TodoListWidget } from "@/components/dashboard/TodoListWidget";
import { LeadMetricsBand, PaperBand, StatArrow } from "@/components/dashboard/PaperBand";

export function SalesManagerDashboard() {
  const summary = useDashboardSummary();
  const untouched = useLeadCategoryCount("untouched");
  const unassigned = useLeadCategoryCount("unassigned");
  const teamQuery = useMyTeam();

  const teamMembers = teamQuery.data?.teamMembers ?? [];
  const totalTeamLeads = teamMembers.reduce((sum, m) => sum + (m.stats?.totalLeads ?? 0), 0);
  const quickActions = ROLE_QUICK_ACTIONS.sales_manager;

  return (
    <div className="space-y-4 font-sans pb-12">
      <LeadMetricsBand
        summary={summary.data}
        summaryLoading={summary.isLoading}
        untouched={untouched.data}
        untouchedLoading={untouched.isLoading}
        unassigned={unassigned.data}
        unassignedLoading={unassigned.isLoading}
      />

      {/* ── Recent Leads (2/3) & Missed Follow-ups (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-b border-zinc-200">
        <div className="lg:col-span-2">
          <RecentLeadsTable />
        </div>

        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <FollowUpsWidget />
        </div>
      </div>

      {/* ── My Todos ── */}
      <div className="py-8 border-t border-zinc-200">
        <TodoListWidget />
      </div>

      {/* ── My Team & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-8 border-t border-zinc-200">
        <div className="flex flex-col">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">My Team</h3>
            <p className="text-xs text-zinc-400 mt-1">Team overview</p>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-center">
            <Link
              href="/my-team"
              className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 p-4 bg-white hover:bg-zinc-50/50 hover:border-zinc-300 transition-all shadow-sm group"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0 bg-violet-50 text-violet-600 transition-transform group-hover:scale-105">
                <Users2 className="h-6 w-6" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-700 font-secondary group-hover:text-zinc-900">My Team</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {teamQuery.isLoading ? "Loading..." : `${teamMembers.length} members · ${totalTeamLeads} leads`}
                </p>
              </div>
            </Link>
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
