"use client";

import { useState } from "react";
import { Download, Wrench } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccessGuard } from "@/components/shared/Guards";
import { Pagination } from "@/components/ui/Pagination";
import { useAbsentReport } from "@/hooks/useHrms";
import { DEFAULT_PAGE_SIZE } from "@/constants";

const now = new Date();

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function dayName(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AE", { weekday: "short", timeZone: "UTC" });
}

export default function AbsentReportPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAbsentReport({
    month, year, department: department || undefined, page, pageSize: DEFAULT_PAGE_SIZE,
  });

  const rows = data?.data ?? [];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  function handleExport() {
    const headers = ["Employee", "Department", "Date", "Day", "Manual"];
    const csvRows = rows.map((r) => [
      r.fullName,
      r.department ?? "",
      formatDate(r.date),
      dayName(r.date),
      r.isManualOverride ? "Yes" : "No",
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absent_report_${year}_${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }

  return (
    <AccessGuard module="hrms" page="attendance_reports">
      <div className="space-y-6">
        <PageHeader
          title="Absent Report"
          subtitle="Employees who were absent during the selected period"
          actions={
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <input
            type="text"
            placeholder="Department…"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
          />
        </div>

        {/* Total badge */}
        {data && (
          <div className="flex gap-3 text-sm">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
              Total Absent Records: <strong>{data.total}</strong>
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-slate-500">No absent records for this period.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-semibold">Employee</th>
                    <th className="px-5 py-3 text-left font-semibold">Department</th>
                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                    <th className="px-5 py-3 text-left font-semibold">Day</th>
                    <th className="px-5 py-3 text-left font-semibold">Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => (
                    <tr key={`${row.userId}-${row.date}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">{row.fullName}</td>
                      <td className="px-5 py-3 text-slate-500">{row.department ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(row.date)}</td>
                      <td className="px-5 py-3 text-slate-500">{dayName(row.date)}</td>
                      <td className="px-5 py-3">
                        {row.isManualOverride ? (
                          <span title="Manual override"><Wrench className="h-3.5 w-3.5 text-amber-500" /></span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        )}
      </div>
    </AccessGuard>
  );
}
