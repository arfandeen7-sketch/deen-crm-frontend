"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useMyAttendance, useAttendanceUserSummary } from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ATTENDANCE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const now = new Date();

  const { user } = useAuth();
  const { canModule } = usePermissions();
  const { data, isLoading } = useMyAttendance({ page, pageSize });
  const { data: summary } = useAttendanceUserSummary(user?.id ?? "", { month: now.getMonth() + 1, year: now.getFullYear() }, canModule("hrms"));

  const formatHours = (value: AttendanceRecord["totalWorkingHours"]) => {
    if (value === null || value === undefined) return "—";
    const num = Number(value);
    if (Number.isNaN(num)) return "—";
    return `${num.toFixed(1)}h`;
  };

  const columns: Column<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "checkIn", header: "Check In", render: (r) => r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : "—" },
    { key: "checkOut", header: "Check Out", render: (r) => r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : "—" },
    { key: "hours", header: "Hours", render: (r) => formatHours(r.totalWorkingHours) },
    { key: "status", header: "Status", render: (r) => <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>{r.status.replace("_", " ")}</Badge> },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <Link
          href={`/my-hr/attendance-corrections?date=${r.date.split("T")[0]}`}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
          title="Raise a correction request for this day"
        >
          <AlertCircle className="h-3 w-3" /> Raise Correction
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        subtitle="Check in/out and view attendance history"
        actions={
          <Link href="/my-hr/attendance-corrections">
            <Button variant="outline" size="sm">View Correction Requests</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AttendanceCheckInOut />
        {/* Monthly Summary */}
        {summary && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">This Month Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{summary.presentDays}</p>
                <p className="text-xs text-emerald-600">Present</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-3 text-center">
                <p className="text-2xl font-bold text-rose-700">{summary.absentDays}</p>
                <p className="text-xs text-rose-600">Absent</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 text-center">
                <p className="text-2xl font-bold text-orange-700">{summary.lateDays}</p>
                <p className="text-xs text-orange-600">Late</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{summary.halfDays}</p>
                <p className="text-xs text-amber-600">Half Days</p>
              </div>
              <div className="rounded-lg bg-sky-50 p-3 text-center">
                <p className="text-2xl font-bold text-sky-700">{summary.leaveDays}</p>
                <p className="text-xs text-sky-600">Leave</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3 text-center">
                <p className="text-2xl font-bold text-indigo-700">{summary.overtimeHours != null ? `${summary.overtimeHours.toFixed(1)}h` : "—"}</p>
                <p className="text-xs text-gray-900">Overtime</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable<AttendanceRecord>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
  );
}
