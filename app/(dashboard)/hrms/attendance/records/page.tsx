"use client";

import { useState } from "react";
import { Download, Eye, Calendar, User } from "lucide-react";
import { useAttendanceList, useAttendanceUserSummary, useEmployeeList } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ATTENDANCE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { attendanceService } from "@/services/attendance/attendance.service";
import { formatDate } from "@/lib/utils";
import { AccessGuard } from "@/components/shared/Guards";
import type { AttendanceRecord } from "@/types";

export default function AttendanceRecordsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);

  const { data, isLoading } = useAttendanceList({
    page,
    pageSize,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    userId: selectedUserId || undefined,
  });

  const { data: employees } = useEmployeeList({ page: 1, pageSize: 100 });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: summary } = useAttendanceUserSummary(
    selectedUserId || "",
    { month: currentMonth, year: currentYear }
  );

  const handleExport = async () => {
    const blob = await attendanceService.export({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      userId: selectedUserId || undefined,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("en-AE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dubai",
    });
  };

  const columns: Column<AttendanceRecord>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "checkIn", header: "Check In", render: (r) => formatTime(r.checkInTime) },
    { key: "checkOut", header: "Check Out", render: (r) => formatTime(r.checkOutTime) },
    {
      key: "totalWorkingHours",
      header: "Hours",
      render: (r) => (r.totalWorkingHours != null ? `${Number(r.totalWorkingHours).toFixed(1)}h` : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>
          {r.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "override",
      header: "Override",
      render: (r) => (r.isManualOverride ? "Yes" : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button
          onClick={() => setViewingRecord(r)}
          className="text-accent hover:text-accent/80 text-sm font-medium"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <AccessGuard module="hrms" page="attendance">
      <div className="space-y-6">
        <PageHeader
          title="Attendance Records"
          subtitle="View and manage employee attendance records"
          actions={
            <Button onClick={handleExport} variant="secondary" size="sm">
              <Download className="h-4 w-4" />
              Export
            </Button>
          }
        />

        {/* Filters */}
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                <Calendar className="inline h-3 w-3 mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                <Calendar className="inline h-3 w-3 mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                <User className="inline h-3 w-3 mr-1" />
                Employee
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Employees</option>
                {employees?.data.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Monthly Summary (if user selected) */}
        {selectedUserId && summary && (
          <div className="rounded-xl border border-border bg-background p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Monthly Summary ({currentMonth}/{currentYear})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-emerald-600">{summary.present}</div>
                <div className="text-xs text-foreground-secondary mt-1">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-orange-600">{summary.late}</div>
                <div className="text-xs text-foreground-secondary mt-1">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-amber-600">{summary.half_day}</div>
                <div className="text-xs text-foreground-secondary mt-1">Half Day</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-rose-600">{summary.absent}</div>
                <div className="text-xs text-foreground-secondary mt-1">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-sky-600">{summary.leave}</div>
                <div className="text-xs text-foreground-secondary mt-1">Leave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-slate-500">{summary.weekend}</div>
                <div className="text-xs text-foreground-secondary mt-1">Weekend</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-violet-600">{summary.holiday}</div>
                <div className="text-xs text-foreground-secondary mt-1">Holiday</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-foreground">{summary.total}</div>
                <div className="text-xs text-foreground-secondary mt-1">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <DataTable<AttendanceRecord>
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          loading={isLoading}
        />

        {/* Pagination */}
        {data && (
          <Pagination
            page={data.page}
            pageSize={pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Attendance Details</h3>
              <button
                onClick={() => setViewingRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Employee</div>
                  <div className="text-sm font-medium text-foreground">
                    {viewingRecord.user?.fullName || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Date</div>
                  <div className="text-sm font-medium text-foreground">
                    {formatDate(viewingRecord.date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Check In</div>
                  <div className="text-sm font-medium text-foreground">
                    {formatTime(viewingRecord.checkInTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Check Out</div>
                  <div className="text-sm font-medium text-foreground">
                    {formatTime(viewingRecord.checkOutTime)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Working Hours</div>
                  <div className="text-sm font-medium text-foreground">
                    {viewingRecord.totalWorkingHours != null
                      ? `${Number(viewingRecord.totalWorkingHours).toFixed(1)}h`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Status</div>
                  <Badge className={ATTENDANCE_STATUS_COLORS[viewingRecord.status]}>
                    {viewingRecord.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Photos */}
              {(viewingRecord.checkInPhotoUrl || viewingRecord.checkOutPhotoUrl) && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                  {viewingRecord.checkInPhotoUrl && (
                    <div>
                      <div className="text-xs text-foreground-secondary mb-2">Check-In Photo</div>
                      <img
                        src={viewingRecord.checkInPhotoUrl}
                        alt="Check-in"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                  {viewingRecord.checkOutPhotoUrl && (
                    <div>
                      <div className="text-xs text-foreground-secondary mb-2">Check-Out Photo</div>
                      <img
                        src={viewingRecord.checkOutPhotoUrl}
                        alt="Check-out"
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                </div>
              )}

              {viewingRecord.isManualOverride && (
                <div className="pt-4 border-t">
                  <div className="text-xs text-foreground-secondary mb-1">Override Reason</div>
                  <div className="text-sm text-foreground">
                    {viewingRecord.overrideReason || "—"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AccessGuard>
  );
}
