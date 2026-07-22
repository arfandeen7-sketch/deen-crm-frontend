"use client";

import { useState } from "react";
import { useMyAttendance, useAttendanceCalendar } from "@/hooks/useHrms";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { ATTENDANCE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const now = new Date();

  const { data, isLoading } = useMyAttendance({ page, pageSize });
  const { data: calendar } = useAttendanceCalendar({ month: now.getMonth() + 1, year: now.getFullYear() });

  const summary = calendar?.summary;

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
  ];

  return (
    <AccessGuard module="my_hr" page="my_attendance">
      <div className="space-y-6">
        <PageHeader title="My Attendance" subtitle="Check in/out and view attendance history" />

        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceCheckInOut />
          {/* Monthly Summary */}
          {summary && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">This Month Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-emerald-50 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{summary.present}</p>
                  <p className="text-xs text-emerald-600">Present</p>
                </div>
                <div className="rounded-lg bg-rose-50 p-3 text-center">
                  <p className="text-2xl font-bold text-rose-700">{summary.absent}</p>
                  <p className="text-xs text-rose-600">Absent</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <p className="text-2xl font-bold text-orange-700">{summary.late}</p>
                  <p className="text-xs text-orange-600">Late</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{summary.half_day}</p>
                  <p className="text-xs text-amber-600">Half Days</p>
                </div>
                <div className="rounded-lg bg-sky-50 p-3 text-center">
                  <p className="text-2xl font-bold text-sky-700">{summary.leave}</p>
                  <p className="text-xs text-sky-600">Leave</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-700">{summary.totalWorkingHours.toFixed(1)}h</p>
                  <p className="text-xs text-indigo-600">Total Hours</p>
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
    </AccessGuard>
  );
}
