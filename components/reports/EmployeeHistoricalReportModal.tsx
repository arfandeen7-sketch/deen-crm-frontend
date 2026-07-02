"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { DonutChart } from "@/components/charts/DonutChart";
import { DistributionBarChart } from "@/components/charts/DistributionBarChart";
import { timeAgo } from "@/lib/utils";
import { useEmployeeReport } from "@/hooks/useLeadReports";
import type { EmployeePerformance, LeadReportParams } from "@/types";

const QUICK_RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
];

function buildDefaultRange(): Required<Pick<LeadReportParams, "dateFrom" | "dateTo">> {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

function metric(value: number, suffix = "") {
  return (
    <p className="text-lg font-semibold text-slate-900">
      {Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
      {suffix}
    </p>
  );
}

export interface EmployeeHistoricalReportModalProps {
  open: boolean;
  onClose: () => void;
  employee?: EmployeePerformance;
}

export function EmployeeHistoricalReportModal({ open, onClose, employee }: EmployeeHistoricalReportModalProps) {
  const [range, setRange] = useState(buildDefaultRange);

  useEffect(() => {
    if (open) {
      setRange(buildDefaultRange());
    }
  }, [open, employee?.userId]);

  const params = useMemo<LeadReportParams>(() => ({
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
  }), [range]);

  const report = useEmployeeReport(employee?.userId, params);

  const stats = useMemo(() => {
    const data = report.data;
    if (!data) {
      return {
        assigned: 0,
        touchRate: 0,
        conversionRate: 0,
        followUpRate: 0,
        missedFollowUps: 0,
        lastActivityAt: undefined as string | undefined,
      };
    }
    const assigned = data.assigned;
    const touched = data.touched;
    const converted = data.converted ?? 0;
    const fuTotal = data.followedUp + data.missedFollowUps;
    return {
      assigned,
      touchRate: assigned > 0 ? (touched / assigned) * 100 : 0,
      conversionRate: assigned > 0 ? (converted / assigned) * 100 : 0,
      followUpRate: fuTotal > 0 ? (data.followedUp / fuTotal) * 100 : 0,
      missedFollowUps: data.missedFollowUps,
      lastActivityAt: data.lastActivityAt ?? undefined,
    };
  }, [report.data]);

  const statusMix = useMemo(() => {
    const breakdown = report.data?.statusBreakdown ?? {};
    return Object.entries(breakdown).map(([label, value]) => ({ label, value }));
  }, [report.data?.statusBreakdown]);

  const statusBars = useMemo(() => {
    const breakdown = report.data?.statusBreakdown ?? {};
    const entries = Object.entries(breakdown).map(([status, count]) => ({ label: status, value: count }));
    return entries.sort((a, b) => b.value - a.value);
  }, [report.data?.statusBreakdown]);

  const handleQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    setRange({ dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) });
  };

  const handleReset = () => setRange(buildDefaultRange());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Historical Report · ${employee?.fullName ?? ""}`}
      description="Review performance trends across any date range."
      size="xl"
    >
      {!employee ? (
        <EmptyState title="No employee selected" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Date Range</span>
            <input
              type="date"
              value={range.dateFrom}
              max={range.dateTo}
              onChange={(e) => setRange((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={range.dateTo}
              min={range.dateFrom}
              onChange={(e) => setRange((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
            />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {QUICK_RANGES.map((preset) => (
                <Button key={preset.label} size="sm" variant="ghost" onClick={() => handleQuickRange(preset.days)}>
                  {preset.label}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="ml-2">Reset</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <UserAvatar name={employee.fullName} size="lg" />
            <div>
              <p className="text-base font-semibold text-slate-900">{employee.fullName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {employee.role && <RoleBadge role={employee.role} />}
                {employee.department && <span>{employee.department}</span>}
                {employee.designation && <span>· {employee.designation}</span>}
              </div>
            </div>
            <div className="ml-auto text-right text-sm text-slate-500">
              <p className="font-medium text-slate-600">Last activity</p>
              <p>{stats.lastActivityAt ? timeAgo(stats.lastActivityAt) : "—"}</p>
            </div>
          </div>

          {report.isLoading ? (
            <LoadingState label="Loading historical stats…" />
          ) : !report.data ? (
            <EmptyState title="No data for this range" message="Try a different date range to view this employee's performance." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  {metric(stats.assigned)}
                  <p className="text-[11px] text-slate-500">Assigned</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  {metric(stats.touchRate, "%")}
                  <p className="text-[11px] text-slate-500">Touch Rate</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  {metric(stats.conversionRate, "%")}
                  <p className="text-[11px] text-slate-500">Conversion</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  {metric(stats.followUpRate, "%")}
                  <p className="text-[11px] text-slate-500">Follow-up Rate</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  {metric(stats.missedFollowUps)}
                  <p className="text-[11px] text-slate-500">Missed F/U</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-lg font-semibold text-slate-900">{range.dateFrom} → {range.dateTo}</p>
                  <p className="text-[11px] text-slate-500">Range</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-medium uppercase text-slate-400">Status Mix</p>
                  {statusMix.length === 0 ? (
                    <p className="pt-6 text-sm text-slate-400">No status data available.</p>
                  ) : (
                    <DonutChart data={statusMix} />
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-medium uppercase text-slate-400">Status Breakdown</p>
                  {statusBars.length === 0 ? (
                    <p className="pt-6 text-sm text-slate-400">No status data available.</p>
                  ) : (
                    <DistributionBarChart data={statusBars} />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">Status Details</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {statusBars.map((row) => (
                    <div key={row.label} className="flex items-center gap-4 px-4 py-2 text-sm">
                      <span className="font-medium text-slate-700">{row.label}</span>
                      <div className="ml-auto flex items-center gap-2 text-slate-500">
                        <span>{row.value.toLocaleString()}</span>
                        {stats.assigned > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                            {((row.value / stats.assigned) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {statusBars.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">No leads match this range.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
