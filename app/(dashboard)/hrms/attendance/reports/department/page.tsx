"use client";

import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccessGuard } from "@/components/shared/Guards";
import { useDepartmentReport } from "@/hooks/useHrms";
import type { DepartmentReportRow } from "@/types";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const now = new Date();

export default function DepartmentReportPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useDepartmentReport({ month, year });

  const rows: DepartmentReportRow[] = data?.rows ?? [];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  function handleExport() {
    const headers = ["Department", "Present", "Late", "Half Day", "Absent", "Leave", "Weekend", "Holiday", "Total"];
    const csvRows = rows.map((r) => [
      r.department, r.present, r.late, r.half_day, r.absent, r.leave, r.weekend, r.holiday, r.total,
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dept_report_${year}_${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }

  const chartData = {
    labels: rows.map((r) => r.department),
    datasets: [
      { label: "Present", data: rows.map((r) => r.present), backgroundColor: "rgba(16,185,129,0.75)" },
      { label: "Late", data: rows.map((r) => r.late), backgroundColor: "rgba(245,158,11,0.75)" },
      { label: "Half Day", data: rows.map((r) => r.half_day), backgroundColor: "rgba(249,115,22,0.75)" },
      { label: "Absent", data: rows.map((r) => r.absent), backgroundColor: "rgba(239,68,68,0.75)" },
      { label: "Leave", data: rows.map((r) => r.leave), backgroundColor: "rgba(14,165,233,0.75)" },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
      title: { display: false },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };

  return (
    <AccessGuard module="hrms" page="attendance_reports">
      <div className="space-y-6">
        <PageHeader
          title="Department Attendance Report"
          subtitle="Monthly attendance breakdown by department"
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
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-slate-500">No department data for this period.</p>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Stacked Bar Chart</h3>
              <Bar data={chartData} options={chartOptions} />
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Department</th>
                      <th className="px-5 py-3 text-right font-semibold text-emerald-600">Present</th>
                      <th className="px-5 py-3 text-right font-semibold text-amber-600">Late</th>
                      <th className="px-5 py-3 text-right font-semibold text-orange-600">Half Day</th>
                      <th className="px-5 py-3 text-right font-semibold text-rose-600">Absent</th>
                      <th className="px-5 py-3 text-right font-semibold text-sky-600">Leave</th>
                      <th className="px-5 py-3 text-right font-semibold text-slate-500">Weekend</th>
                      <th className="px-5 py-3 text-right font-semibold text-violet-600">Holiday</th>
                      <th className="px-5 py-3 text-right font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={row.department} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{row.department}</td>
                        <td className="px-5 py-3 text-right text-emerald-600">{row.present}</td>
                        <td className="px-5 py-3 text-right text-amber-600">{row.late}</td>
                        <td className="px-5 py-3 text-right text-orange-600">{row.half_day}</td>
                        <td className="px-5 py-3 text-right text-rose-600">{row.absent}</td>
                        <td className="px-5 py-3 text-right text-sky-600">{row.leave}</td>
                        <td className="px-5 py-3 text-right text-slate-400">{row.weekend}</td>
                        <td className="px-5 py-3 text-right text-violet-600">{row.holiday}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-700">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  {rows.length > 1 && (
                    <tfoot>
                      <tr className="bg-slate-50 text-sm font-semibold text-slate-700">
                        <td className="px-5 py-3">Totals</td>
                        {(["present", "late", "half_day", "absent", "leave", "weekend", "holiday", "total"] as (keyof DepartmentReportRow)[]).map((key) => (
                          <td key={key} className="px-5 py-3 text-right">
                            {rows.reduce((sum, r) => sum + (r[key] as number), 0)}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AccessGuard>
  );
}
