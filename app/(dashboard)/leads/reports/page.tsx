"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Printer, FileSpreadsheet, FileText, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import { LoadingState } from "@/components/ui/States";
import { LeadTabs } from "@/components/leads/LeadTabs";
import {
  useSourceReport,
  useStatusReport,
  useUserPerformance,
  useLeadTimeSeries,
} from "@/hooks/useLeadReports";
import { reportsService } from "@/services/leads/reports.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, cn } from "@/lib/utils";
import type { LeadReportParams } from "@/types";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

export default function LeadReportsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [period, setPeriod] = useState<Period>("daily");
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);

  const params: LeadReportParams = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const timeSeriesParams: LeadReportParams = { ...params, period };

  const sourceReport = useSourceReport(params);
  const statusReport = useStatusReport(params);
  const userPerf = useUserPerformance(params);
  const timeSeries = useLeadTimeSeries(timeSeriesParams);

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

  const hasDateFilter = Boolean(dateFrom || dateTo);

  return (
    <div className="space-y-6">
      <LeadTabs />

      <PageHeader
        title="Lead Reports"
        subtitle="Analytics, performance metrics, and exportable reports"
        actions={
          <>
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
              <DonutChart
                data={(sourceReport.data ?? []).map((d) => ({
                  label: d.source,
                  value: d.count,
                }))}
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
              <DonutChart
                data={(statusReport.data ?? []).map((d) => ({
                  label: d.status,
                  value: d.count,
                }))}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Charts row 2: User Performance + Lead Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="User Performance Analytics"
            subtitle="Leads assigned vs converted per user"
          />
          <CardBody>
            {userPerf.isLoading ? (
              <LoadingState />
            ) : (
              <BarChart
                data={(userPerf.data ?? []).map((d) => ({
                  label: d.fullName,
                  value: d.assigned,
                  secondary: d.converted,
                }))}
                color="bg-indigo-500"
                secondaryColor="bg-emerald-400"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Conversion Analytics"
            subtitle="Lead trend over time"
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
            ) : (
              <BarChart
                data={(timeSeries.data ?? []).map((d) => ({
                  label: d.date,
                  value: d.count,
                }))}
                color="bg-sky-500"
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Status report table */}
      <Card>
        <CardHeader
          title="Lead Status Report"
          subtitle="Detailed status breakdown with counts and percentages"
        />
        <CardBody className="p-0">
          {statusReport.isLoading ? (
            <LoadingState />
          ) : (statusReport.data ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No data available for the selected period.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Count</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statusReport.data!.map((row) => (
                  <tr key={row.status} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {row.percentage.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Source report table */}
      <Card>
        <CardHeader
          title="Lead Source Report"
          subtitle="Breakdown by acquisition source"
        />
        <CardBody className="p-0">
          {sourceReport.isLoading ? (
            <LoadingState />
          ) : (sourceReport.data ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No data available for the selected period.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Count</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sourceReport.data!.map((row) => (
                  <tr key={row.source} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium capitalize text-slate-800">
                      {row.source}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {row.count.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {row.percentage.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* User performance table */}
      <Card>
        <CardHeader
          title="User Performance Report"
          subtitle="Leads assigned, converted, and follow-ups completed per user"
        />
        <CardBody className="p-0">
          {userPerf.isLoading ? (
            <LoadingState />
          ) : (userPerf.data ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              No data available for the selected period.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Leads Assigned</th>
                  <th className="px-5 py-3">Leads Converted</th>
                  <th className="px-5 py-3">Follow Ups Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userPerf.data!.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {row.fullName}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{row.assigned}</td>
                    <td className="px-5 py-3 text-emerald-600 font-medium">
                      {row.converted}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {row.followUpsCompleted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
