"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  X,
  RefreshCw,
  Users,
  UserPlus,
  MousePointerClick,
  Target,
  CalendarCheck,
  Timer,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { DistributionBarChart } from "@/components/charts/DistributionBarChart";
import { LineChart } from "@/components/charts/LineChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { PermissionGuard } from "@/components/shared/Guards";
import { KpiCard } from "@/components/reports/KpiCard";
import { EmployeePerformanceCard } from "@/components/reports/EmployeePerformanceCard";
import { Leaderboard } from "@/components/reports/Leaderboard";
import { EmployeeFilterBar, type EmployeeSortKey } from "@/components/reports/EmployeeFilterBar";
import {
  useSourceReport,
  useStatusReport,
  useUserPerformance,
  useLeadTimeSeries,
  usePriorityReport,
  useKpiComparison,
  useEmployeePerformanceList,
  useSendReminder,
  previousPeriodRange,
} from "@/hooks/useLeadReports";
import { reportsService } from "@/services/leads/reports.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, cn } from "@/lib/utils";
import { LEAD_FUNNEL_STAGES } from "@/constants";
import type { LeadReportParams, LeaderboardEntry } from "@/types";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

const REFRESH_OPTIONS = [
  { key: 0, label: "Off" },
  { key: 5 * 60_000, label: "5 min" },
  { key: 10 * 60_000, label: "10 min" },
  { key: 30 * 60_000, label: "30 min" },
] as const;

const PIN_STORAGE_KEY = "deen_crm_pinned_employees";

function readPinned(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(PIN_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function LeadReportsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState<Period>("daily");
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [empSearch, setEmpSearch] = useState("");
  const [empDepartment, setEmpDepartment] = useState("");
  const [empRole, setEmpRole] = useState("");
  const [empSort, setEmpSort] = useState<EmployeeSortKey>("performanceScore");
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    setPinned(readPinned());
  }, []);

  function togglePin(userId: string) {
    setPinned((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
      window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const params: LeadReportParams = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const timeSeriesParams: LeadReportParams = { ...params, period };
  const refetchInterval = refreshInterval || false;

  const sourceReport = useSourceReport(params, { refetchInterval });
  const statusReport = useStatusReport(params, { refetchInterval });
  const userPerf = useUserPerformance(params, { refetchInterval });
  const timeSeries = useLeadTimeSeries(timeSeriesParams);
  const priorityReport = usePriorityReport(params);
  const { kpis, isLoading: kpisLoading, summaryUnavailable } = useKpiComparison(params);
  const employees = useEmployeePerformanceList(params);
  const sendReminder = useSendReminder();

  const prevRange = useMemo(() => previousPeriodRange(dateFrom || undefined, dateTo || undefined), [dateFrom, dateTo]);
  const prevUserPerf = useUserPerformance(prevRange, { refetchInterval: false });

  useEffect(() => {
    if (userPerf.data) setLastUpdated(new Date());
  }, [userPerf.data]);

  async function handleExport(format: "xlsx" | "csv") {
    setExporting(format);
    try {
      const blob = await reportsService.exportReport({ ...params, format });
      downloadBlob(
        blob,
        `lead-report-${new Date().toISOString().slice(0, 10)}.${format === "xlsx" ? "xlsx" : "csv"}`,
      );
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleManualRefresh() {
    sourceReport.refetch();
    statusReport.refetch();
    userPerf.refetch();
    toast.success("Report data refreshed");
  }

  function handleSendReminder(userId: string, fullName: string) {
    sendReminder.mutate(userId, {
      onSuccess: () => toast.success(`Reminder sent to ${fullName}`),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  }

  const hasDateFilter = Boolean(dateFrom || dateTo);

  // Approximate funnel from current status snapshot (see LEAD_FUNNEL_STAGES notes).
  const funnelData = useMemo(() => {
    const rows = statusReport.data ?? [];
    const byStatus = new Map(rows.map((r) => [r.status, r.count]));
    const max = LEAD_FUNNEL_STAGES.reduce((m, s) => Math.max(m, byStatus.get(s) ?? 0), 1);
    return LEAD_FUNNEL_STAGES.map((stage) => {
      const count = byStatus.get(stage) ?? 0;
      return { stage, count, percentage: (count / max) * 100 };
    });
  }, [statusReport.data]);

  const departments = useMemo(
    () => Array.from(new Set(employees.data.map((e) => e.department).filter(Boolean))) as string[],
    [employees.data],
  );
  const roles = useMemo(
    () => Array.from(new Set(employees.data.map((e) => e.role).filter(Boolean))) as string[],
    [employees.data],
  );

  const filteredEmployees = useMemo(() => {
    let list = employees.data.filter((e) => {
      if (empSearch && !e.fullName.toLowerCase().includes(empSearch.toLowerCase())) return false;
      if (empDepartment && e.department !== empDepartment) return false;
      if (empRole && e.role !== empRole) return false;
      return true;
    });
    list = [...list].sort((a, b) => (b[empSort] ?? 0) - (a[empSort] ?? 0));
    return [...list.filter((e) => pinned.includes(e.userId)), ...list.filter((e) => !pinned.includes(e.userId))];
  }, [employees.data, empSearch, empDepartment, empRole, empSort, pinned]);

  const topConversion: LeaderboardEntry[] = useMemo(
    () =>
      [...employees.data]
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5)
        .map((e, i) => ({ userId: e.userId, fullName: e.fullName, value: e.conversionRate, rank: i + 1 })),
    [employees.data],
  );

  const topTouch: LeaderboardEntry[] = useMemo(
    () =>
      [...employees.data]
        .sort((a, b) => b.touchRate - a.touchRate)
        .slice(0, 5)
        .map((e, i) => ({ userId: e.userId, fullName: e.fullName, value: e.touchRate, rank: i + 1 })),
    [employees.data],
  );

  const needsAttention: LeaderboardEntry[] = useMemo(
    () =>
      [...employees.data]
        .filter((e) => e.touchRate < 50 || e.conversionRate < 15)
        .sort((a, b) => a.performanceScore - b.performanceScore)
        .slice(0, 5)
        .map((e, i) => ({ userId: e.userId, fullName: e.fullName, value: e.performanceScore, rank: i + 1 })),
    [employees.data],
  );

  const mostImproved: LeaderboardEntry[] = useMemo(() => {
    const prevByUser = new Map((prevUserPerf.data ?? []).map((r) => [r.userId, r]));
    return [...employees.data]
      .map((e) => {
        const prev = prevByUser.get(e.userId);
        const prevConv = prev && prev.assigned > 0 ? (prev.touched / prev.assigned) * 100 : 0;
        return { userId: e.userId, fullName: e.fullName, value: e.touchRate - prevConv };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }, [employees.data, prevUserPerf.data]);

  return (
    <PermissionGuard permission="leads.reports">
    <div className="space-y-6">
      <LeadTabs />

      <PageHeader
        title="Lead Reports"
        subtitle="Analytics, performance metrics, and exportable reports"
        actions={
          <>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
              title="Auto-refresh interval"
            >
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  Auto-refresh: {o.label}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              loading={exporting === "csv"}
            >
              <FileText className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("xlsx")}
              loading={exporting === "xlsx"}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </>
        }
      />

      {lastUpdated && (
        <p className="text-right text-xs text-slate-400">
          Last updated {lastUpdated.toLocaleTimeString("en-GB")}
        </p>
      )}

      {/* Date range filter */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Download className="h-4 w-4 text-slate-400" />
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setDateFrom(""); setDateTo(""); }}
            >
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Leads" icon={Users} accent="indigo" loading={kpisLoading} value={kpis?.totalLeads.current} comparison={hasDateFilter ? kpis?.totalLeads : null} />
        <KpiCard
          label="New Leads"
          icon={UserPlus}
          accent="sky"
          loading={kpisLoading}
          value={kpis?.newLeads.current}
          comparison={hasDateFilter ? kpis?.newLeads : null}
          history={timeSeries.data?.map(d => ({ date: d.date, count: d.count }))}
        />
        <KpiCard
          label="Touch Rate"
          icon={MousePointerClick}
          accent="emerald"
          loading={kpisLoading}
          value={kpis?.touchRate.current.toFixed(0)}
          suffix="%"
          comparison={hasDateFilter ? kpis?.touchRate : null}
        />
        <KpiCard
          label="Conversion Rate"
          icon={Target}
          accent="violet"
          loading={kpisLoading}
          value={kpis?.conversionRate.current.toFixed(0)}
          suffix="%"
          comparison={hasDateFilter ? kpis?.conversionRate : null}
        />
        <KpiCard
          label="Follow-up Completion"
          icon={CalendarCheck}
          accent="amber"
          loading={kpisLoading}
          value={kpis?.followUpCompletionRate.current.toFixed(0)}
          suffix="%"
          comparison={hasDateFilter ? kpis?.followUpCompletionRate : null}
        />
        <KpiCard
          label="Avg. Response Time"
          icon={Timer}
          accent="rose"
          loading={kpisLoading}
          value={kpis?.avgResponseTimeMinutes != null ? Math.round(kpis.avgResponseTimeMinutes) : "—"}
          suffix={kpis?.avgResponseTimeMinutes != null ? " min" : ""}
        />
      </div>
      {summaryUnavailable && (
        <p className="-mt-2 text-xs text-slate-400">
          &quot;New Leads&quot; and &quot;Avg. Response Time&quot; require the <code>/leads/report/summary</code> backend endpoint (not yet available) — showing best-effort fallback values.
        </p>
      )}

      {/* Advanced charts row: Funnel + Lead Generation Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lead Funnel" subtitle="Current status snapshot (Fresh → Interested → Existing Client)" />
          <CardBody>
            {statusReport.isLoading ? <LoadingState /> : <FunnelChart data={funnelData} />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Lead Generation Trend"
            subtitle="New leads created over time"
            action={
              <div className="flex gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                      period === p.key
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:bg-slate-100",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody>
            {timeSeries.isLoading ? (
              <LoadingState />
            ) : timeSeries.isError ? (
              <EmptyState
                title="Trend data unavailable"
                message="Requires the GET /leads/report/timeseries backend endpoint."
              />
            ) : (
              <LineChart
                data={(timeSeries.data ?? []).map((d) => ({ label: d.date, value: d.count }))}
                color="#0ea5e9" // sky-500
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts row 1: Source + Status distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Lead Source Distribution"
            subtitle="Breakdown of leads by acquisition channel"
          />
          <CardBody>
            {sourceReport.isLoading ? (
              <LoadingState />
            ) : (
              <DistributionBarChart
                data={(sourceReport.data ?? []).map((d) => ({
                  label: d.source,
                  value: d.count,
                }))}
                useCategoricalColors
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Lead Status Distribution"
            subtitle="Current status spread across all leads"
          />
          <CardBody>
            {statusReport.isLoading ? (
              <LoadingState />
            ) : (
              <DistributionBarChart
                data={(statusReport.data ?? []).map((d) => ({
                  label: d.status,
                  value: d.count,
                }))}
                useCategoricalColors
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Employee Performance Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Employee Performance</h2>

        <EmployeeFilterBar
          search={empSearch}
          onSearchChange={setEmpSearch}
          department={empDepartment}
          onDepartmentChange={setEmpDepartment}
          departments={departments}
          role={empRole}
          onRoleChange={setEmpRole}
          roles={roles}
          sortKey={empSort}
          onSortKeyChange={setEmpSort}
        />

        {employees.isLoading ? (
          <LoadingState label="Loading employee performance…" />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState title="No employees match your filters" />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredEmployees.map((e) => (
              <EmployeePerformanceCard
                key={e.userId}
                item={e}
                pinned={pinned.includes(e.userId)}
                onTogglePin={() => togglePin(e.userId)}
                onSendReminder={() => handleSendReminder(e.userId, e.fullName)}
                sendingReminder={sendReminder.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Team Leaderboards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Leaderboard title="Top Conversion Rate" entries={topConversion} suffix="%" />
        <Leaderboard title="Top Touch Rate" entries={topTouch} suffix="%" />
        <Leaderboard title="Needs Attention" entries={needsAttention} suffix=" pts" emptyLabel="All employees performing well." />
        <Leaderboard title="Most Improved" entries={mostImproved} suffix=" pts" emptyLabel="No previous period data." />
      </div>
    </div>
    </PermissionGuard>
  );
}
