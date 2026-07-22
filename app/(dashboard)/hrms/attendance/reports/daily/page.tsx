"use client";

import { useState } from "react";
import { Download, Plus, Eye, Wrench } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccessGuard } from "@/components/shared/Guards";
import { Badge } from "@/components/ui/Badge";
import { ManualAttendanceModal } from "@/components/hrms/ManualAttendanceModal";
import { AuditLogDrawer } from "@/components/hrms/AuditLogDrawer";
import { useDailyReport } from "@/hooks/useHrms";
import { ATTENDANCE_STATUS_COLORS } from "@/constants";
import type { DailyReportRow } from "@/types";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

const STATUS_OPTIONS = ["present", "late", "half_day", "absent", "leave", "no_record"];

export default function DailyReportPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [department, setDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [auditAttendanceId, setAuditAttendanceId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useDailyReport({ date, department: department || undefined });

  const rows: DailyReportRow[] = data?.rows ?? [];

  const filtered = filterStatus
    ? rows.filter((r) => r.status === filterStatus || (filterStatus === "no_record" && !r.status))
    : rows;

  function handleExport() {
    const headers = ["Employee", "Department", "Designation", "Status", "Check-in", "Check-out", "Hours", "Manual"];
    const csvRows = filtered.map((r) => [
      r.fullName,
      r.department ?? "",
      r.designation ?? "",
      r.status ?? "No Record",
      r.checkInTime ? formatTime(r.checkInTime) : "",
      r.checkOutTime ? formatTime(r.checkOutTime) : "",
      r.totalWorkingHours != null ? Number(r.totalWorkingHours).toFixed(1) : "",
      r.isManualOverride ? "Yes" : "No",
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily_report_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }

  const summary = data?.summary;

  return (
    <AccessGuard module="hrms" page="attendance_reports">
      <div className="space-y-6">
        <PageHeader
          title="Daily Attendance Report"
          subtitle="Attendance summary for a specific date"
          actions={
            <div className="flex gap-2">
              <button
                onClick={() => setManualOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-4 w-4" /> Manual Entry
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Department…"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
            {[
              { label: "Total", val: summary.total, cls: "bg-slate-50 text-slate-700" },
              { label: "Present", val: summary.present, cls: "bg-emerald-50 text-emerald-700" },
              { label: "Late", val: summary.late, cls: "bg-amber-50 text-amber-700" },
              { label: "Half Day", val: summary.half_day, cls: "bg-orange-50 text-orange-700" },
              { label: "Absent", val: summary.absent, cls: "bg-rose-50 text-rose-700" },
              { label: "On Leave", val: summary.onLeave, cls: "bg-sky-50 text-sky-700" },
              { label: "No Record", val: summary.noRecord, cls: "bg-slate-50 text-slate-500" },
            ].map(({ label, val, cls }) => (
              <div key={label} className={`rounded-xl p-3 text-center ${cls} border border-slate-200`}>
                <p className="text-xl font-bold">{val}</p>
                <p className="text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-slate-500">No records found for this date.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-semibold">Employee</th>
                    <th className="px-5 py-3 text-left font-semibold">Department</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Check-in</th>
                    <th className="px-5 py-3 text-left font-semibold">Check-out</th>
                    <th className="px-5 py-3 text-left font-semibold">Hours</th>
                    <th className="px-5 py-3 text-left font-semibold">Manual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row, idx) => (
                    <tr key={`${row.userId}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{row.fullName}</p>
                        {row.designation && <p className="text-xs text-slate-400">{row.designation}</p>}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{row.department ?? "—"}</td>
                      <td className="px-5 py-3">
                        {row.status ? (
                          <Badge className={ATTENDANCE_STATUS_COLORS[row.status] ?? "bg-slate-100 text-slate-600"}>
                            {row.status.replace("_", " ")}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">No Record</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{formatTime(row.checkInTime)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatTime(row.checkOutTime)}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {row.totalWorkingHours != null ? `${Number(row.totalWorkingHours).toFixed(1)}h` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {row.isManualOverride ? (
                          <span title="Manual override"><Wrench className="h-3.5 w-3.5 text-amber-500" /></span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ManualAttendanceModal
          open={manualOpen}
          onClose={() => { setManualOpen(false); refetch(); }}
        />

        <AuditLogDrawer
          open={!!auditAttendanceId}
          onClose={() => setAuditAttendanceId(null)}
          attendanceId={auditAttendanceId}
        />
      </div>
    </AccessGuard>
  );
}
