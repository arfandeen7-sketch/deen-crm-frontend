"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, X, RotateCcw } from "lucide-react";
import { useMyAttendance, useAttendanceGet } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { ATTENDANCE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
  { value: "weekend", label: "Weekend" },
  { value: "holiday", label: "Holiday" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" });
}

function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(1)}h`;
}

function DetailDrawer({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Attendance Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={ATTENDANCE_STATUS_COLORS[record.status]}>
              {record.status.replace("_", " ")}
            </Badge>
            <span className="text-slate-500">{formatDate(record.date)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Check-in</p>
              <p className="font-medium text-slate-900">{formatTime(record.checkInTime)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Check-out</p>
              <p className="font-medium text-slate-900">{formatTime(record.checkOutTime)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Working Hours</p>
              <p className="font-medium text-slate-900">{formatHours(record.totalWorkingHours)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Manual Override</p>
              <p className="font-medium text-slate-900">{record.isManualOverride ? "Yes" : "No"}</p>
            </div>
          </div>

          {record.checkInLatitude != null && record.checkInLongitude != null && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Check-in Location</p>
              <p className="font-medium text-slate-900 text-xs">
                {record.checkInLatitude.toFixed(6)}, {record.checkInLongitude.toFixed(6)}
              </p>
            </div>
          )}

          {record.checkOutLatitude != null && record.checkOutLongitude != null && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Check-out Location</p>
              <p className="font-medium text-slate-900 text-xs">
                {record.checkOutLatitude.toFixed(6)}, {record.checkOutLongitude.toFixed(6)}
              </p>
            </div>
          )}

          {record.notes && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Notes</p>
              <p className="text-sm text-slate-700">{record.notes}</p>
            </div>
          )}

          {record.overrideReason && (
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Override Reason</p>
              <p className="text-sm text-slate-700">{record.overrideReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AttendanceHistoryPage() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useMyAttendance({
    page,
    pageSize,
    month,
    year,
    status: status || undefined,
  });

  const { data: selectedRecord } = useAttendanceGet(selectedId);

  const columns: Column<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "checkIn", header: "Check In", render: (r) => formatTime(r.checkInTime) },
    { key: "checkOut", header: "Check Out", render: (r) => formatTime(r.checkOutTime) },
    { key: "hours", header: "Hours", render: (r) => formatHours(r.totalWorkingHours) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>{r.status.replace("_", " ")}</Badge>
          {r.isManualOverride && (
            <span title={r.overrideReason ?? undefined}>
              <Badge className="bg-indigo-100 text-indigo-700">
                Corrected
              </Badge>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      render: (r) => {
        const canCorrect = r.status === "absent" || !r.checkInTime || !r.checkOutTime;
        const correctionHref = `/my-hr/attendance-correction?date=${r.date.split("T")[0]}&attendanceId=${r.id}&currentStatus=${r.status}`;
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedId(r.id)}
              className="p-1 text-slate-400 hover:text-indigo-600"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {canCorrect && (
              <Link
                href={correctionHref}
                className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                title="Request correction for this attendance"
              >
                <RotateCcw className="h-3 w-3" />
                Correct
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <AccessGuard module="my_hr" page="attendance_history">
      <div className="space-y-6">
        <PageHeader title="Attendance History" subtitle="View your past attendance records" />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <DataTable<AttendanceRecord>
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          loading={isLoading}
          emptyTitle="No records"
          emptyMessage="No attendance records found for the selected filters."
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

        {selectedRecord && (
          <DetailDrawer record={selectedRecord} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </AccessGuard>
  );
}
