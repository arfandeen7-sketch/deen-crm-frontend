"use client";

import Link from "next/link";
import {
  Users2,
  Sparkles,
  ThumbsUp,
  Snowflake,
  CalendarX,
  CalendarCheck,
  UserPlus,
  Upload,
  Handshake,
  Briefcase,
  Ghost,
  FileDown,
  UserCheck,
  UserX,
  BarChart2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { StatusBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { timeAgo } from "@/lib/utils";
import {
  useDashboardSummary,
  useStatusAnalytics,
  useRecentLeads,
  useStatusCount,
  useMissedFollowupCount,
  useTodayFollowupCount,
  useLeadCategoryCount,
} from "@/hooks/useDashboard";

const QUICK_ACTIONS = [
  { label: "Create Lead", href: "/leads/create", icon: UserPlus, accent: "text-indigo-600 bg-indigo-50" },
  { label: "Import Leads", href: "/leads/import", icon: Upload, accent: "text-emerald-600 bg-emerald-50" },
  { label: "Lead Reports", href: "/leads/reports", icon: BarChart2, accent: "text-sky-600 bg-sky-50" },
  { label: "Add Broker", href: "/brokers/create", icon: Handshake, accent: "text-amber-600 bg-amber-50" },
  { label: "Add Candidate", href: "/hr/candidates/create", icon: Briefcase, accent: "text-violet-600 bg-violet-50" },
];

export default function DashboardOverviewPage() {
  const summary = useDashboardSummary();
  const analytics = useStatusAnalytics();
  const recent = useRecentLeads();
  const fresh = useStatusCount("Fresh");
  const interested = useStatusCount("Interested");
  const cold = useStatusCount("Cold");
  const missed = useMissedFollowupCount();
  const today = useTodayFollowupCount();
  const untouched = useLeadCategoryCount("untouched");
  const imported = useLeadCategoryCount("imported");
  const assigned = useLeadCategoryCount("assigned");
  const unassigned = useLeadCategoryCount("unassigned");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your leads, follow-ups, and recent activity"
      />

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Leads" value={summary.data?.totalLeads} icon={Users2} accent="indigo" loading={summary.isLoading} />
        <StatCard label="Fresh Leads" value={fresh.data} icon={Sparkles} accent="sky" loading={fresh.isLoading} />
        <StatCard label="Interested" value={interested.data} icon={ThumbsUp} accent="emerald" loading={interested.isLoading} />
        <StatCard label="Cold Leads" value={cold.data} icon={Snowflake} accent="violet" loading={cold.isLoading} />
        <StatCard label="Missed Follow Ups" value={missed.data} icon={CalendarX} accent="rose" loading={missed.isLoading} />
        <StatCard label="Today's Follow Ups" value={today.data} icon={CalendarCheck} accent="amber" loading={today.isLoading} />
      </div>

      {/* Lead category cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Untouched Leads" value={untouched.data} icon={Ghost} accent="rose" loading={untouched.isLoading} href="/leads/untouched" />
        <StatCard label="Imported Leads" value={imported.data} icon={FileDown} accent="sky" loading={imported.isLoading} href="/leads/imported" />
        <StatCard label="Assigned Leads" value={assigned.data} icon={UserCheck} accent="emerald" loading={assigned.isLoading} href="/leads/assigned" />
        <StatCard label="Unassigned Leads" value={unassigned.data} icon={UserX} accent="amber" loading={unassigned.isLoading} href="/leads/unassigned" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Leads by Source" subtitle="Distribution across ingestion channels" />
          <CardBody>
            {summary.isLoading ? (
              <LoadingState />
            ) : (
              <DonutChart
                data={(summary.data?.sourceCounts ?? []).map((s) => ({
                  label: s.source,
                  value: s.count,
                }))}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Last 24 Hour Activity"
            subtitle="Status updates in the past day"
          />
          <CardBody>
            {analytics.isLoading ? (
              <LoadingState />
            ) : (
              <BarChart
                data={(analytics.data?.analytics ?? []).map((a) => ({
                  label: a.status,
                  value: a.updateCount,
                  secondary: a.leadCount,
                }))}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${a.accent}`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-slate-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Recent leads */}
      <Card>
        <CardHeader
          title="Recent Leads"
          action={
            <Link href="/leads" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          }
        />
        <CardBody className="p-0">
          {recent.isLoading ? (
            <LoadingState />
          ) : (recent.data?.data.length ?? 0) === 0 ? (
            <EmptyState title="No leads yet" message="New leads will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.data?.data.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <UserAvatar name={lead.leadName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{lead.leadName}</p>
                    <p className="text-xs text-slate-500">
                      {lead.source} · {lead.mobileNumber}
                    </p>
                  </div>
                  <StatusBadge status={lead.leadStatus} />
                  <span className="hidden w-24 text-right text-xs text-slate-400 sm:block">
                    {timeAgo(lead.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
