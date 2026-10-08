"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, RefreshCw, ExternalLink, Handshake, Banknote, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { LoadingState, EmptyState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { DonutChart } from "@/components/charts/DonutChart";
import { DistributionBarChart } from "@/components/charts/DistributionBarChart";
import { cn, formatCurrency, formatDateTime, displayValue, uaeDateISO } from "@/lib/utils";
import { useEmployeeReport } from "@/hooks/useLeadReports";
import { useDealClosedList } from "@/hooks/useDealClosed";
import { CONVERTED_LEAD_STATUSES } from "@/constants";
import type { EmployeePerformance, LeadReportParams, UserPerformanceItem } from "@/types";

const QUICK_RANGES = [
  { label: "Today", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
];

function metricValue(value: string, className: string) {
  return <p className={cn("text-lg font-semibold tabular-nums", className)}>{value}</p>;
}

function reportMetrics(data: UserPerformanceItem | null | undefined) {
  const assigned = data?.assigned ?? 0;
  const converted =
    data?.converted ??
    CONVERTED_LEAD_STATUSES.reduce((sum, status) => sum + (data?.statusBreakdown?.[status] ?? 0), 0);
  const followedUp = data?.followedUp ?? 0;
  const missedFollowUps = data?.missedFollowUps ?? 0;
  const followUpTotal = followedUp + missedFollowUps;
  const dealsClosed = data?.dealsClosed ?? 0;
  const salesAmount = data?.salesAmount ?? 0;
  return {
    totalLeads: assigned,
    manuallyCreated: data?.manuallyCreated ?? 0,
    masterAssigned: data?.masterAssigned ?? 0,
    ownersCreatedManually: data?.ownersCreatedManually ?? 0,
    ownersFromConvert: data?.ownersFromConvert ?? 0,
    touchRate: assigned > 0 ? ((data?.touched ?? 0) / assigned) * 100 : 0,
    conversionRate: assigned > 0 ? (converted / assigned) * 100 : 0,
    followUpRate: followUpTotal > 0 ? (followedUp / followUpTotal) * 100 : 0,
    dealsClosed,
    salesAmount,
    avgDealValue: data?.avgDealValue ?? (dealsClosed > 0 ? salesAmount / dealsClosed : 0),
    missedFollowUps,
  };
}

export interface EmployeeHistoricalReportModalProps {
  open: boolean;
  onClose: () => void;
  employee?: EmployeePerformance;
  /** Range currently applied to the employee cards. The report opens on this range. */
  dateFrom?: string;
  dateTo?: string;
}

export function EmployeeHistoricalReportModal({
  open,
  onClose,
  employee,
  dateFrom,
  dateTo,
}: EmployeeHistoricalReportModalProps) {
  const cardRange = useMemo(
    () => ({
      dateFrom: dateFrom || uaeDateISO(),
      dateTo: dateTo || dateFrom || uaeDateISO(),
    }),
    [dateFrom, dateTo],
  );
  const [range, setRange] = useState(cardRange);
  const [dealPage, setDealPage] = useState(1);
  const [dealPageSize, setDealPageSize] = useState(25);

  useEffect(() => {
    if (open) {
      setRange(cardRange);
      setDealPage(1);
    }
  }, [open, employee?.userId, cardRange]);

  useEffect(() => {
    setDealPage(1);
  }, [range.dateFrom, range.dateTo]);

  const params = useMemo<LeadReportParams>(
    () => ({
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    }),
    [range],
  );

  const report = useEmployeeReport(employee?.userId, params);
  const stats = useMemo(() => reportMetrics(report.data), [report.data]);

  const deals = useDealClosedList({
    employeeId: employee?.userId,
    closedFrom: range.dateFrom,
    closedTo: range.dateTo,
    page: dealPage,
    pageSize: dealPageSize,
  });
  const dealRows = deals.data?.data ?? [];
  const dealTotal = deals.data?.total ?? 0;
  const dealTotalPages = deals.data?.totalPages ?? 0;

  const handleQuickRange = (days: number) => {
    setRange({ dateFrom: uaeDateISO(-(days - 1)), dateTo: uaeDateISO() });
  };

  const statusMix = useMemo(() => {
    const breakdown = report.data?.statusBreakdown ?? {};
    return Object.entries(breakdown).map(([label, value]) => ({ label, value }));
  }, [report.data?.statusBreakdown]);

  const statusBars = useMemo(() => {
    const breakdown = report.data?.statusBreakdown ?? {};
    return Object.entries(breakdown)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [report.data?.statusBreakdown]);

  const tiles = [
    { label: "Total Leads", value: stats.totalLeads.toLocaleString(), className: "text-slate-900" },
    { label: "Manually Created", value: stats.manuallyCreated.toLocaleString(), className: "text-indigo-600" },
    { label: "Master Assigned", value: stats.masterAssigned.toLocaleString(), className: "text-violet-700" },
    { label: "Owners Created Manually", value: stats.ownersCreatedManually.toLocaleString(), className: "text-amber-700" },
    { label: "Owners from Convert", value: stats.ownersFromConvert.toLocaleString(), className: "text-orange-700" },
    { label: "Touch Rate", value: `${stats.touchRate.toFixed(0)}%`, className: "text-emerald-600" },
    { label: "Conversion", value: `${stats.conversionRate.toFixed(0)}%`, className: "text-slate-900" },
    { label: "Follow Up", value: `${stats.followUpRate.toFixed(0)}%`, className: "text-sky-600" },
    { label: "Deal Closed", value: stats.dealsClosed.toLocaleString(), className: "text-teal-700" },
    { label: "Sales", value: formatCurrency(stats.salesAmount), className: "text-teal-800" },
    { label: "Missed Follow Ups", value: stats.missedFollowUps.toLocaleString(), className: "text-rose-600" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Full Report · ${employee?.fullName ?? ""}`}
      description="Same performance figures as the employee card, for any date range."
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
              <Button size="sm" variant="outline" onClick={() => setRange(cardRange)}>
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
          </div>

          {report.isLoading ? (
            <LoadingState label="Loading report…" />
          ) : report.isError ? (
            <EmptyState title="Couldn't load this report" message="Try a different date range." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {tiles.map((tile) => (
                  <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                    {metricValue(tile.value, tile.className)}
                    <p className="text-[11px] text-slate-500">{tile.label}</p>
                  </div>
                ))}
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
                        {stats.totalLeads > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                            {((row.value / stats.totalLeads) * 100).toFixed(1)}%
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

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Handshake className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-800">Sales Performance</h3>
              <span className="ml-auto text-xs text-slate-400">
                {range.dateFrom} → {range.dateTo}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
                <div className="flex items-center justify-center text-emerald-700">
                  <Handshake className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.dealsClosed}</p>
                <p className="text-[11px] text-slate-500">Total Deals Closed</p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 text-center">
                <div className="flex items-center justify-center text-teal-700">
                  <Banknote className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-teal-700">{formatCurrency(stats.salesAmount)}</p>
                <p className="text-[11px] text-slate-500">Total Sales Value</p>
              </div>
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-center">
                <div className="flex items-center justify-center text-indigo-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="mt-1 text-2xl font-bold text-indigo-700">{formatCurrency(stats.avgDealValue)}</p>
                <p className="text-[11px] text-slate-500">Avg Deal Value</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">
                Closed Deals
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {range.dateFrom} → {range.dateTo}
                  {!report.isLoading && stats.dealsClosed > 0 && ` · ${stats.dealsClosed} ${stats.dealsClosed === 1 ? "deal" : "deals"}`}
                </span>
              </p>
            </div>

            {deals.isLoading ? (
              <LoadingState label="Loading sales…" />
            ) : dealRows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No deals closed in this date range.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5">Lead</th>
                      <th className="px-4 py-2.5">Client</th>
                      <th className="px-4 py-2.5">Project / Property</th>
                      <th className="px-4 py-2.5 text-right">Sales Value</th>
                      <th className="px-4 py-2.5">Closed Date</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dealRows.map((deal) => (
                      <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{deal.leadName}</p>
                          <p className="text-xs text-slate-400">{deal.leadSource}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{displayValue(deal.client?.fullName)}</p>
                          <p className="text-xs text-slate-400">{displayValue(deal.client?.mobileNumber)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{displayValue(deal.projectName)}</p>
                          <p className="text-xs text-slate-400">
                            {[
                              deal.community,
                              deal.propertyType,
                              deal.unitNumber && `Unit ${deal.unitNumber}`,
                              deal.propertySize && `${deal.propertySize} sqft`,
                            ].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-emerald-700">{formatCurrency(deal.salesValue)}</p>
                          <p className="text-xs text-slate-400">{deal.currency}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{formatDateTime(deal.closedAt)}</p>
                          <p className="text-xs text-slate-400">by {displayValue(deal.closedBy?.fullName)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/leads/${deal.leadId}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="View lead"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {!report.isLoading && (
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50/50 font-semibold">
                        <td className="px-4 py-3 text-slate-700" colSpan={3}>
                          Total ({stats.dealsClosed} {stats.dealsClosed === 1 ? "deal" : "deals"})
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-700">
                          {formatCurrency(stats.salesAmount)}
                        </td>
                        <td className="px-4 py-3" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
            {dealTotal > dealPageSize && (
              <Pagination
                page={dealPage}
                pageSize={dealPageSize}
                total={dealTotal}
                totalPages={dealTotalPages}
                onPageChange={setDealPage}
                onPageSizeChange={(size) => {
                  setDealPageSize(size);
                  setDealPage(1);
                }}
              />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
