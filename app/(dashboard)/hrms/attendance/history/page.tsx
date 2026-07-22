"use client";

import { useState } from "react";
import { Download, Eye, Wrench, RotateCcw, X, MapPin, Clock } from "lucide-react";
import { useMyAttendance, useAttendanceList, useAttendanceGet } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AuditLogDrawer } from "@/components/hrms/AuditLogDrawer";
import { ATTENDANCE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { attendanceService } from "@/services/attendance/attendance.service";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";
import { useRouter } from "next/navigation";

function formatGps(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null) return "—";
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function isToday(dateStr: string): boolean {
  return dateStr.startsWith(new Date().toISOString().split("T")[0]);
}

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

export default function AttendanceHistoryPage() {
  const { isMaster, canPage } = useAuth();
  const isHr = isMaster || canPage("hrms", "attendance");
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [status, setStatus] = useState("");
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);
  const [auditRecord, setAuditRecord] = useState<AttendanceRecord | null>(null);

  const query = { page, pageSize, month, year, status: status || undefined };

  const myResult = useMyAttendance(query);
  const hrResult = useAttendanceList(query);
  const { data, isLoading } = isHr ? hrResult : myResult;

  const isWeekendOrHoliday = (r: AttendanceRecord) =>
    r.status === "weekend" || r.status === "holiday";

  async function handleExport() {
    const blob = await attendanceService.export({ month, year });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${year}_${String(month).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
  }));
  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  const columns: Column<AttendanceRecord>[] = [
    ...(isHr
      ? [{ key: "employee", header: "Employee", render: (r: AttendanceRecord) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{r.user?.fullName ?? "—"}</span>
            {r.user?.employeeId && (
              <span className="text-xs text-slate-400">{r.user.employeeId}</span>
            )}
          </div>
        ) }]
      : []),
    ...(isHr
      ? [{ key: "dept", header: "Dept", render: (r: AttendanceRecord) => r.user?.department ?? "—" }]
      : []),
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    {
      key: "day",
      header: "Day",
      render: (r) => new Date(r.date).toLocaleDateString("en-AE", { weekday: "short", timeZone: "UTC" }),
    },
    { key: "checkIn", header: "Check-in", render: (r) => formatTime(r.checkInTime) },
    {
      key: "checkOut",
      header: "Check-out",
      render: (r) => {
        if (r.checkOutTime) return formatTime(r.checkOutTime);
        if (r.checkInTime) return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
        return "—";
      },
    },
    {
      key: "hours",
      header: "Hours",
      render: (r) => {
        if (r.totalWorkingHours != null) return `${Number(r.totalWorkingHours).toFixed(1)}h`;
        if (r.checkInTime && !r.checkOutTime && isToday(r.date))
          return <span className="text-indigo-500 font-medium">Running</span>;
        return "—";
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge className={ATTENDANCE_STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}>
          {r.status?.replace("_", " ") ?? "—"}
        </Badge>
      ),
    },
    {
      key: "gps",
      header: "GPS",
      render: (r) =>
        r.checkInLatitude != null ? (
          <span className="text-xs text-slate-500" title={formatGps(r.checkInLatitude, r.checkInLongitude)}>
            <MapPin className="inline h-3 w-3 text-emerald-500" /> {r.checkInLatitude.toFixed(2)}, {r.checkInLongitude?.toFixed(2)}
          </span>
        ) : "—",
    },
    {
      key: "manual",
      header: "Manual",
      render: (r) => r.isManualOverride ? <span title="Manual override"><Wrench className="h-3.5 w-3.5 text-amber-500" /></span> : "—",
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailRecord(r)}
            className="p-1 text-slate-400 hover:text-indigo-600"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAuditRecord(r)}
            className="p-1 text-slate-400 hover:text-slate-600"
            title="Audit log"
          >
            <Clock className="h-4 w-4" />
          </button>
          {!isWeekendOrHoliday(r) && r.date <= new Date().toISOString().split("T")[0] && (
            <button
              onClick={() => router.push(`/hrms/attendance/regularization?date=${r.date.split("T")[0]}&attendanceId=${r.id}&currentStatus=${r.status}`)}
              className="p-1 text-slate-400 hover:text-orange-600"
              title="Request correction"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance History"
        subtitle={isHr ? "All employee attendance records" : "Your complete attendance record"}
        actions={
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
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
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {["present", "late", "half_day", "absent", "leave", "weekend", "holiday"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      <DataTable<AttendanceRecord>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        emptyMessage="No attendance records for this period."
      />

      {/* Detail Modal */}
      {detailRecord && (
        <DetailModal
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onOpenAudit={() => { setAuditRecord(detailRecord); setDetailRecord(null); }}
          onRegularize={() => {
            router.push(`/hrms/attendance/regularization?date=${detailRecord.date.split("T")[0]}&attendanceId=${detailRecord.id}&currentStatus=${detailRecord.status}`);
            setDetailRecord(null);
          }}
          canRegularize={!isWeekendOrHoliday(detailRecord) && detailRecord.date <= new Date().toISOString().split("T")[0]}
        />
      )}

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

      <AuditLogDrawer
        open={!!auditRecord}
        onClose={() => setAuditRecord(null)}
        attendanceId={auditRecord?.id ?? null}
        employeeName={auditRecord?.user?.fullName}
        date={auditRecord?.date ? formatDate(auditRecord.date) : undefined}
      />
    </div>
  );
}

function DetailModal({
  record,
  onClose,
  onOpenAudit,
  onRegularize,
  canRegularize,
}: {
  record: AttendanceRecord;
  onClose: () => void;
  onOpenAudit: () => void;
  onRegularize: () => void;
  canRegularize: boolean;
}) {
  const { data: fullRecord, isLoading } = useAttendanceGet(record.id);
  const r = fullRecord ?? record;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">Attendance Details</h3>
            {r.user?.fullName && (
              <p className="text-xs text-slate-500 mt-0.5">{r.user.fullName}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500 text-xs">Date</p><p className="font-medium">{formatDate(r.date)}</p></div>
            <div>
              <p className="text-slate-500 text-xs">Status</p>
              <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>{r.status?.replace("_", " ")}</Badge>
            </div>
            <div><p className="text-slate-500 text-xs">Check-in</p><p className="font-medium">{formatTime(r.checkInTime)}</p></div>
            <div>
              <p className="text-slate-500 text-xs">Check-out</p>
              {r.checkOutTime ? (
                <p className="font-medium">{formatTime(r.checkOutTime)}</p>
              ) : r.checkInTime ? (
                <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div>
              <p className="text-slate-500 text-xs">Working Hours</p>
              <p className="font-medium">
                {r.totalWorkingHours != null
                  ? `${Number(r.totalWorkingHours).toFixed(1)}h`
                  : r.checkInTime && !r.checkOutTime && isToday(r.date)
                    ? <span className="text-indigo-500">Running</span>
                    : "—"}
              </p>
            </div>
            <div><p className="text-slate-500 text-xs">Manual Override</p><p className="font-medium">{r.isManualOverride ? "Yes" : "No"}</p></div>
          </div>

          {r.overrideReason && (
            <div><p className="text-xs text-slate-500">Override Reason</p><p className="text-sm mt-0.5">{r.overrideReason}</p></div>
          )}

          {(r.checkInLatitude != null || r.checkOutLatitude != null) && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              {r.checkInLatitude != null && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1"><MapPin className="h-3 w-3 text-emerald-500" /> Check-in GPS</p>
                  <p className="text-xs font-medium text-slate-700">{formatGps(r.checkInLatitude, r.checkInLongitude)}</p>
                </div>
              )}
              {r.checkOutLatitude != null && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500" /> Check-out GPS</p>
                  <p className="text-xs font-medium text-slate-700">{formatGps(r.checkOutLatitude, r.checkOutLongitude)}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 mb-1">Check-in Photo</p>
              {isLoading ? (
                <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
              ) : r.checkInPhotoUrl ? (
                <img src={r.checkInPhotoUrl} alt="check-in" className="h-28 w-full object-cover rounded-lg border border-slate-200" />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-400">No photo</div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Check-out Photo</p>
              {isLoading ? (
                <div className="h-28 w-full animate-pulse rounded-lg bg-slate-100" />
              ) : r.checkOutPhotoUrl ? (
                <img src={r.checkOutPhotoUrl} alt="check-out" className="h-28 w-full object-cover rounded-lg border border-slate-200" />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-400">
                  {r.checkInTime && !r.checkOutTime ? "Pending" : "No photo"}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onOpenAudit}>
              <Clock className="h-4 w-4" /> Audit Log
            </Button>
            {canRegularize && (
              <Button variant="secondary" size="sm" onClick={onRegularize}>
                <RotateCcw className="h-4 w-4" /> Request Correction
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
