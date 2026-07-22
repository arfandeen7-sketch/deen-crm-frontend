"use client";

import { useState } from "react";
import { Users2, UserCheck, Activity, UserMinus, Clock, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccessGuard } from "@/components/shared/Guards";
import { Badge } from "@/components/ui/Badge";
import { ManualAttendanceModal } from "@/components/hrms/ManualAttendanceModal";
import { AuditLogDrawer } from "@/components/hrms/AuditLogDrawer";
import { useAttendanceDashboard, useDailyReport } from "@/hooks/useHrms";
import { ATTENDANCE_STATUS_COLORS } from "@/constants";
import type { DailyReportRow, AttendanceRecord } from "@/types";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

export default function AttendanceDashboardPage() {
  const { data, isLoading } = useAttendanceDashboard();
  const today = new Date().toISOString().split("T")[0];
  const { data: daily } = useDailyReport({ date: today });

  const [manualOpen, setManualOpen] = useState(false);
  const [auditRecord, setAuditRecord] = useState<{ id: string; name?: string; date?: string } | null>(null);

  const progress = data ? Math.min(100, Math.round((data.totalWorkingHours / (data.totalStaff * (data.targetHours || 9))) * 100)) : 0;

  return (
    <AccessGuard module="hrms" page="attendance_dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Attendance Dashboard"
          subtitle={`Live snapshot — ${new Date().toLocaleDateString("en-AE", { dateStyle: "full", timeZone: "Asia/Dubai" })}`}
          actions={
            <button
              onClick={() => setManualOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Manual Entry
            </button>
          }
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Staff" value={data.totalStaff} icon={Users2} color="bg-slate-100 text-slate-600" />
              <StatCard label="Checked In" value={data.checkedIn} icon={UserCheck} color="bg-emerald-100 text-emerald-600" />
              <StatCard label="Currently Working" value={data.currentlyWorking} icon={Activity} color="bg-sky-100 text-sky-600" />
              <StatCard label="Checked Out" value={data.checkedOut} icon={UserMinus} color="bg-indigo-100 text-indigo-600" />
            </div>

            {/* Status Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Today's Status Breakdown</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: "Present", val: data.present, cls: "bg-emerald-100 text-emerald-700" },
                  { label: "Late", val: data.late, cls: "bg-amber-100 text-amber-700" },
                  { label: "Half Day", val: data.half_day, cls: "bg-orange-100 text-orange-700" },
                  { label: "Absent", val: data.absent, cls: "bg-rose-100 text-rose-700" },
                  { label: "On Leave", val: data.onLeave, cls: "bg-sky-100 text-sky-700" },
                  { label: "No Record", val: data.noRecord, cls: "bg-slate-100 text-slate-500" },
                ].map(({ label, val, cls }) => (
                  <span key={label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${cls}`}>
                    {label}: {val}
                  </span>
                ))}
              </div>
            </div>

            {/* Working Hours Progress */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Total Working Hours Today
                </div>
                <span className="text-sm text-slate-500">{data.totalWorkingHours.toFixed(1)}h / {(data.totalStaff * (data.targetHours || 9)).toFixed(0)}h target</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{progress}% of daily target reached</p>
            </div>
          </>
        ) : null}

        {/* Daily Quick View */}
        {daily && daily.rows.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-sm font-semibold text-slate-700">Present Now — Sorted by Check-in</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-5 py-3 text-left font-semibold">Employee</th>
                    <th className="px-5 py-3 text-left font-semibold">Department</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Check-in</th>
                    <th className="px-5 py-3 text-left font-semibold">Check-out</th>
                    <th className="px-5 py-3 text-left font-semibold">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daily.rows
                    .filter((r) => r.status === "present" || r.status === "late")
                    .sort((a, b) => (a.checkInTime ?? "").localeCompare(b.checkInTime ?? ""))
                    .map((row) => (
                      <tr key={row.userId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-5 py-3 text-slate-500">{row.department ?? "—"}</td>
                        <td className="px-5 py-3">
                          {row.status ? (
                            <Badge className={ATTENDANCE_STATUS_COLORS[row.status] ?? "bg-slate-100 text-slate-600"}>
                              {row.status.replace("_", " ")}
                            </Badge>
                          ) : <span className="text-slate-400">No Record</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{formatTime(row.checkInTime)}</td>
                        <td className="px-5 py-3 text-slate-600">{formatTime(row.checkOutTime)}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {row.totalWorkingHours != null ? `${Number(row.totalWorkingHours).toFixed(1)}h` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ManualAttendanceModal open={manualOpen} onClose={() => setManualOpen(false)} />

        <AuditLogDrawer
          open={!!auditRecord}
          onClose={() => setAuditRecord(null)}
          attendanceId={auditRecord?.id ?? null}
          employeeName={auditRecord?.name}
          date={auditRecord?.date}
        />
      </div>
    </AccessGuard>
  );
}
