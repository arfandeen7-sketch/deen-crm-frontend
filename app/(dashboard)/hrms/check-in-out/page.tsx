"use client";

import { useState } from "react";
import { Calendar, User, MapPin, Clock, Camera, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { useCheckInOutList, useEmployeeList } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import { TableSkeleton, EmptyState } from "@/components/ui/States";
import { ATTENDANCE_STATUS_COLORS, ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/constants";
import { formatDate } from "@/lib/utils";
import { AccessGuard } from "@/components/shared/Guards";
import type { AttendanceRecord, UserRole } from "@/types";

function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
}

export default function CheckInOutPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedUserId, setSelectedUserId] = useState("");
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);

  const { data, isLoading } = useCheckInOutList({
    page: 1,
    pageSize: 200,
    dateFrom: selectedDate,
    dateTo: selectedDate,
    userId: selectedUserId || undefined,
  });

  const { data: employees } = useEmployeeList({ page: 1, pageSize: 100 });

  const records = data?.data ?? [];
  const checkedIn = records.filter((r) => r.checkInTime).length;
  const checkedOut = records.filter((r) => r.checkOutTime).length;
  const notCheckedIn = (data?.total ?? 0) - checkedIn;

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("en-AE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dubai",
    });
  };

  const formatCoords = (lat: number | null | undefined, lng: number | null | undefined) => {
    if (lat == null || lng == null) return null;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const mapsLink = (lat: number | null | undefined, lng: number | null | undefined) => {
    if (lat == null || lng == null) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const isToday = selectedDate === todayISO();

  return (
    <AccessGuard module="hrms" page="attendance" action="view">
      <div className="space-y-6">
        <PageHeader
          title="Check-In / Check-Out"
          subtitle="Daily check-in and check-out history with photos and location"
        />

        {/* Date Navigation + Employee Filter */}
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            {/* Date Picker with prev/next */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                <Calendar className="inline h-3 w-3 mr-1" />
                Date
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-neutral-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
                  disabled={isToday}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {!isToday && (
                  <button
                    onClick={() => setSelectedDate(todayISO())}
                    className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            {/* Employee Filter */}
            <div className="sm:w-64">
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                <User className="inline h-3 w-3 mr-1" />
                Employee
              </label>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="All Employees"
              >
                <option value="">All Employees</option>
                {employees?.data.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Day Summary Stats */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-xs text-foreground-secondary mb-1">Date</div>
            <div className="text-lg font-semibold text-foreground">{formatDate(selectedDate)}</div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-xs text-foreground-secondary mb-1 flex items-center gap-1">
              <LogIn className="h-3 w-3 text-emerald-600" />
              Checked In
            </div>
            <div className="text-lg font-semibold text-emerald-600">{checkedIn}</div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-xs text-foreground-secondary mb-1 flex items-center gap-1">
              <LogOut className="h-3 w-3 text-rose-600" />
              Checked Out
            </div>
            <div className="text-lg font-semibold text-rose-600">{checkedOut}</div>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-xs text-foreground-secondary mb-1">Not Checked In</div>
            <div className="text-lg font-semibold text-foreground-secondary">{notCheckedIn}</div>
          </div>
        </div>

        {/* Records — Card Grid */}
        {isLoading ? (
          <TableSkeleton />
        ) : records.length === 0 ? (
          <EmptyState
            title="No records for this day"
            message="No employees checked in on this date. Try selecting a different date."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((r) => (
              <button
                key={r.id}
                onClick={() => setViewingRecord(r)}
                className="text-left rounded-xl border border-border bg-background p-4 hover:border-accent/40 hover:shadow-sm transition-all cursor-pointer space-y-3"
              >
                {/* Employee Header */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground text-sm">{r.user?.fullName || "—"}</span>
                    {r.user?.role && (
                      <span className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_BADGE_CLASSES[r.user.role as UserRole]}`}>
                        {ROLE_LABELS[r.user.role as UserRole] ?? r.user.role}
                      </span>
                    )}
                  </div>
                  <Badge className={ATTENDANCE_STATUS_COLORS[r.status]}>
                    {r.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Check-In / Check-Out Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Check-In */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <LogIn className="h-3 w-3" />
                      CHECK IN
                    </div>
                    {r.checkInPhotoUrl ? (
                      <img
                        src={r.checkInPhotoUrl}
                        alt="Check-in"
                        className="h-16 w-full rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-16 items-center justify-center rounded-lg bg-neutral-50 border border-border">
                        <Camera className="h-4 w-4 text-neutral-300" />
                      </div>
                    )}
                    <div className="text-xs font-medium text-foreground">{formatTime(r.checkInTime)}</div>
                    {r.checkInLatitude != null && r.checkInLongitude != null && (
                      <div className="text-[10px] text-foreground-secondary flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {r.checkInLatitude.toFixed(4)}, {r.checkInLongitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  {/* Check-Out */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-rose-600">
                      <LogOut className="h-3 w-3" />
                      CHECK OUT
                    </div>
                    {r.checkOutPhotoUrl ? (
                      <img
                        src={r.checkOutPhotoUrl}
                        alt="Check-out"
                        className="h-16 w-full rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="flex h-16 items-center justify-center rounded-lg bg-neutral-50 border border-border">
                        <Camera className="h-4 w-4 text-neutral-300" />
                      </div>
                    )}
                    <div className="text-xs font-medium text-foreground">{formatTime(r.checkOutTime)}</div>
                    {r.checkOutLatitude != null && r.checkOutLongitude != null && (
                      <div className="text-[10px] text-foreground-secondary flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {r.checkOutLatitude.toFixed(4)}, {r.checkOutLongitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Working Hours */}
                {r.totalWorkingHours != null && (
                  <div className="flex items-center gap-1 text-xs text-foreground-secondary pt-1 border-t border-border">
                    <Clock className="h-3 w-3" />
                    {Number(r.totalWorkingHours).toFixed(1)}h worked
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        title="Check-In / Check-Out Details"
        size="xl"
      >
        {viewingRecord && (
          <div className="space-y-5">
            {/* Employee Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-foreground-secondary mb-1">Employee</div>
                <div className="text-sm font-medium text-foreground">
                  {viewingRecord.user?.fullName || "—"}
                </div>
                {viewingRecord.user?.role && (
                  <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_BADGE_CLASSES[viewingRecord.user.role as UserRole]}`}>
                    {ROLE_LABELS[viewingRecord.user.role as UserRole] ?? viewingRecord.user.role}
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs text-foreground-secondary mb-1">Date</div>
                <div className="text-sm font-medium text-foreground">
                  {formatDate(viewingRecord.date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-foreground-secondary mb-1">Status</div>
                <Badge className={ATTENDANCE_STATUS_COLORS[viewingRecord.status]}>
                  {viewingRecord.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {/* Check-In / Check-Out Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Check-In */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Check-In
                </div>
                <div className="text-sm text-foreground">
                  <span className="text-foreground-secondary text-xs">Time: </span>
                  {formatTime(viewingRecord.checkInTime)}
                </div>
                {viewingRecord.checkInPhotoUrl && (
                  <div>
                    <div className="text-xs text-foreground-secondary mb-1.5">Photo</div>
                    <img
                      src={viewingRecord.checkInPhotoUrl}
                      alt="Check-in photo"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                {formatCoords(viewingRecord.checkInLatitude, viewingRecord.checkInLongitude) && (
                  <div>
                    <div className="text-xs text-foreground-secondary mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </div>
                    <div className="text-xs text-foreground font-mono">
                      {formatCoords(viewingRecord.checkInLatitude, viewingRecord.checkInLongitude)}
                    </div>
                    {mapsLink(viewingRecord.checkInLatitude, viewingRecord.checkInLongitude) && (
                      <a
                        href={mapsLink(viewingRecord.checkInLatitude, viewingRecord.checkInLongitude)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:text-accent/80 mt-1 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Check-Out */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-rose-600" />
                  Check-Out
                </div>
                <div className="text-sm text-foreground">
                  <span className="text-foreground-secondary text-xs">Time: </span>
                  {formatTime(viewingRecord.checkOutTime)}
                </div>
                {viewingRecord.checkOutPhotoUrl && (
                  <div>
                    <div className="text-xs text-foreground-secondary mb-1.5">Photo</div>
                    <img
                      src={viewingRecord.checkOutPhotoUrl}
                      alt="Check-out photo"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                    />
                  </div>
                )}
                {formatCoords(viewingRecord.checkOutLatitude, viewingRecord.checkOutLongitude) && (
                  <div>
                    <div className="text-xs text-foreground-secondary mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </div>
                    <div className="text-xs text-foreground font-mono">
                      {formatCoords(viewingRecord.checkOutLatitude, viewingRecord.checkOutLongitude)}
                    </div>
                    {mapsLink(viewingRecord.checkOutLatitude, viewingRecord.checkOutLongitude) && (
                      <a
                        href={mapsLink(viewingRecord.checkOutLatitude, viewingRecord.checkOutLongitude)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:text-accent/80 mt-1 inline-block"
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours + Override */}
            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border">
              <div>
                <div className="text-xs text-foreground-secondary mb-1">Working Hours</div>
                <div className="text-sm font-medium text-foreground">
                  {viewingRecord.totalWorkingHours != null
                    ? `${Number(viewingRecord.totalWorkingHours).toFixed(1)}h`
                    : "—"}
                </div>
              </div>
              {viewingRecord.isManualOverride && (
                <div>
                  <div className="text-xs text-foreground-secondary mb-1">Override Reason</div>
                  <div className="text-sm text-foreground">
                    {viewingRecord.overrideReason || "—"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AccessGuard>
  );
}
