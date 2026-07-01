"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, MousePointerClick, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { KpiCard } from "@/components/reports/KpiCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { BarChart } from "@/components/charts/BarChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { useEmployeePerformanceList, useEmployeeActivity, previousPeriodRange } from "@/hooks/useLeadReports";
import { useUser } from "@/hooks/useUsers";
import { cn, timeAgo } from "@/lib/utils";
import { LEAD_FUNNEL_STAGES } from "@/constants";
import type { LeadReportParams } from "@/types";

export default function EmployeeReportPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const reportParams: LeadReportParams = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const employees = useEmployeePerformanceList(reportParams);
  const user = useUser(userId);
  const activity = useEmployeeActivity(userId, { dateFrom, dateTo, pageSize: 200 });

  const prevRange = useMemo(() => previousPeriodRange(dateFrom || undefined, dateTo || undefined), [dateFrom, dateTo]);
  const prevEmployees = useEmployeePerformanceList(prevRange);

  const employee = useMemo(() => employees.data.find((e) => e.userId === userId), [employees.data, userId]);
  const prevEmployee = useMemo(() => prevEmployees.data.find((e) => e.userId === userId), [prevEmployees.data, userId]);

  const donutData = useMemo(
    () => Object.entries(employee?.statusBreakdown ?? {}).map(([label, value]) => ({ label, value })),
    [employee],
  );

  const funnelData = useMemo(() => {
    if (!employee) return [];
    const byStatus = new Map(Object.entries(employee.statusBreakdown ?? {}).map(([k, v]) => [k, v] as [string, number]));
    const max = LEAD_FUNNEL_STAGES.reduce((m, s) => Math.max(m, byStatus.get(s) ?? 0), 1);
    return LEAD_FUNNEL_STAGES.map((stage) => {
      const count = byStatus.get(stage) ?? 0;
      return { stage, count, percentage: (count / max) * 100 };
    });
  }, [employee]);

  const sourceData = useMemo(() => {
    if (!employee) return [];
    const bySource = new Map<string, number>();
    for (const a of activity.data?.data ?? []) {
      const src = a.metadata?.source as string | undefined;
      if (src) bySource.set(src, (bySource.get(src) ?? 0) + 1);
    }
    const max = Math.max(1, ...bySource.values());
    return Array.from(bySource.entries()).map(([label, count]) => ({ label, value: count, percentage: (count / max) * 100 }));
  }, [activity.data]);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  if (employees.isLoading || user.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingState label="Loading employee report…" />
      </div>
    );
  }

  if (!employee || !user.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <EmptyState title="Employee not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Report"
        subtitle="Detailed performance and activity breakdown"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Date Range</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
          />
          {hasDateFilter && (
            <Button size="sm" variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <CardBody className="flex items-center gap-4">
          <UserAvatar name={user.data.fullName} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{user.data.fullName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {user.data.role && <RoleBadge role={user.data.role} />}
              {user.data.department && <span className="text-sm text-slate-500">{user.data.department}</span>}
              {user.data.designation && <span className="text-sm text-slate-500">· {user.data.designation}</span>}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-slate-500">Last activity</p>
            <p className="text-sm font-medium text-slate-700">{timeAgo(employee.lastActivityAt)}</p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Assigned Leads" icon={Target} accent="indigo" value={employee.assigned} />
        <KpiCard label="Touch Rate" icon={MousePointerClick} accent="emerald" value={employee.touchRate.toFixed(0)} suffix="%" />
        <KpiCard label="Conversion Rate" icon={TrendingUp} accent="violet" value={employee.conversionRate.toFixed(0)} suffix="%" />
        <KpiCard label="Follow-up Rate" icon={CalendarCheck} accent="amber" value={employee.followUpCompletionRate.toFixed(0)} suffix="%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Status Breakdown" subtitle="Lead status distribution" />
          <CardBody>
            <DonutChart data={donutData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Lead Funnel" subtitle="Progression through funnel stages" />
          <CardBody>
            <FunnelChart data={funnelData} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Last 7 Days Activity" subtitle="Daily activity trend" />
        <CardBody>
          <Sparkline data={employee.weeklyActivity} />
        </CardBody>
      </Card>

      {sourceData.length > 0 && (
        <Card>
          <CardHeader title="Lead Sources" subtitle="Distribution by acquisition source" />
          <CardBody>
            <BarChart data={sourceData.map((d) => ({ label: d.label, value: d.value }))} color="bg-emerald-500" />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Recent Activity" subtitle="Latest actions on leads" />
        <CardBody className="p-0">
          {activity.isLoading ? (
            <LoadingState />
          ) : (activity.data?.data ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.data!.data.slice(0, 50).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                  <span className="flex-1 font-medium text-slate-700">{a.action.replace(/_/g, " ")}</span>
                  {a.actor && <span className="text-slate-500">{a.actor.fullName}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
