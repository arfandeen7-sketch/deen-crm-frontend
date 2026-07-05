"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { useHrReport } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { hrReportsService, type HrReportType } from "@/services/hrms/hr-reports.service";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/shared/Guards";
import { Select } from "@/components/ui/Input";

const REPORT_TYPES: { value: HrReportType; label: string }[] = [
  { value: "attendance", label: "Attendance Report" },
  { value: "leave", label: "Leave Report" },
  { value: "payroll", label: "Payroll Report" },
  { value: "salary", label: "Salary Report" },
  { value: "employee", label: "Employee Report" },
  { value: "login-activity", label: "Login Activity Report" },
];

export default function HrReportsPage() {
  const now = new Date();
  const [reportType, setReportType] = useState<HrReportType>("attendance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: report, isLoading } = useHrReport(reportType, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    month,
    year,
  });

  const handleExport = async (format: "excel" | "csv" | "pdf") => {
    try {
      const blob = await hrReportsService.exportReport(reportType, format, { dateFrom, dateTo, month, year });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hr-report-${reportType}.${format === "excel" ? "xlsx" : format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <PermissionGuard permission="hrms.reports">
    <div className="space-y-6">
      <PageHeader
        title="HR Reports"
        subtitle="Generate and export HR reports"
        actions={
          <div className="flex gap-2">
            <button onClick={() => handleExport("excel")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Excel
            </button>
            <button onClick={() => handleExport("csv")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> CSV
            </button>
            <button onClick={() => handleExport("pdf")} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Select value={reportType} onChange={(e) => setReportType(e.target.value as HrReportType)} className="h-10 py-0 w-auto font-medium">
          {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </Select>
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="h-10 py-0 w-auto">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString("default", { month: "long" })}</option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 py-0 w-auto">
          {Array.from({ length: 5 }, (_, i) => {
            const y = now.getFullYear() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </Select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg px-3 py-2 text-sm h-10 bg-slate-100/50 border-0" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg px-3 py-2 text-sm h-10 bg-slate-100/50 border-0" placeholder="To" />
      </div>

      {/* Report Content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-gray-900" />
          </div>
        ) : report ? (
          <div>
            <div className="mb-4 flex items-center gap-2 text-slate-700">
              <FileText className="h-5 w-5" />
              <h3 className="text-base font-semibold">
                {REPORT_TYPES.find((r) => r.value === reportType)?.label}
              </h3>
            </div>
            <pre className="max-h-[500px] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">No data available for the selected filters.</p>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}
