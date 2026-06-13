"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";
import { useAttendanceList } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ATTENDANCE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { attendanceService } from "@/services/attendance/attendance.service";
import { formatDate } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";

export default function AttendanceManagementPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useAttendanceList({
    page,
    pageSize,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: status || undefined,
  });

  const handleExport = async () => {
    const blob = await attendanceService.export({ dateFrom, dateTo, status });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<AttendanceRecord>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "checkIn", header: "Check In", render: (r) => r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : "—" },
    { key: "checkOut", header: "Check Out", render: (r) => r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : "—" },
    { key: "workingHours", header: "Hours", render: (r) => r.workingHours != null ? `${r.workingHours.toFixed(1)}h` : "—" },
    { key: "lateMinutes", header: "Late", render: (r) => r.lateMinutes ? `${r.lateMinutes}min` : "—" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>{r.status.replace("_", " ")}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle="View and manage employee attendance"
        actions={
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="half_day">Half Day</option>
          <option value="absent">Absent</option>
          <option value="leave">Leave</option>
        </select>
      </div>

      <DataTable<AttendanceRecord>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination
          page={data.page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}
