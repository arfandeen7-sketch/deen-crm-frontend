"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, AlertCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAttendanceCalendar } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { ATTENDANCE_STATUS_COLORS } from "@/constants";
import type { CalendarDay } from "@/types";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_DOT: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  half_day: "bg-orange-500",
  absent: "bg-rose-500",
  leave: "bg-sky-500",
  weekend: "bg-slate-300",
  holiday: "bg-violet-500",
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

function DayCell({ day, onClick }: { day: CalendarDay; onClick: () => void }) {
  const dateNum = new Date(day.date).getUTCDate();
  const isToday = day.date.startsWith(new Date().toISOString().split("T")[0]);
  const dot = day.attendance?.status ? STATUS_DOT[day.attendance.status] ?? "bg-slate-300" : null;

  return (
    <button
      onClick={onClick}
      className={[
        "relative flex flex-col items-center justify-start rounded-lg border p-1.5 pt-2 h-16 text-xs transition-colors",
        isToday ? "border-indigo-400 bg-indigo-50" : "border-slate-100 bg-white hover:bg-slate-50",
        (day.isWeekend || day.isHoliday) && !day.attendance ? "bg-slate-50 opacity-60" : "",
      ].join(" ")}
    >
      <span className={`font-semibold text-sm ${isToday ? "text-indigo-700" : "text-slate-700"}`}>{dateNum}</span>
      {dot && <span className={`mt-1 h-2 w-2 rounded-full ${dot}`} />}
      {day.hasPendingRegularization && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400" title="Pending regularization" />
      )}
    </button>
  );
}

export default function MyCalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const router = useRouter();

  const { data, isLoading } = useAttendanceCalendar({ month, year });

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-AE", { month: "long", year: "numeric" });

  const days = data?.days ?? [];
  const firstDay = days[0] ? new Date(days[0].date).getUTCDay() : 0;
  const leadingBlanks = Array.from({ length: firstDay });

  const summary = data?.summary;

  return (
    <AccessGuard module="my_hr" page="attendance_calendar">
      <div className="space-y-6">
        <PageHeader title="Attendance Calendar" subtitle="Monthly view of your attendance" />

        {/* Month Navigation */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-600">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-slate-900">{monthLabel}</h2>
          <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-600">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {leadingBlanks.map((_, i) => <div key={`blank-${i}`} />)}
              {days.map((day) => (
                <DayCell key={day.date} day={day} onClick={() => setSelectedDay(day)} />
              ))}
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {Object.entries(STATUS_DOT).map(([s, cls]) => (
            <span key={s} className="flex items-center gap-1.5 text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />
              {s.replace("_", " ")}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            pending correction
          </span>
        </div>

        {/* Summary Row */}
        {summary && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Month Summary</h3>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {[
                { label: "Present", val: summary.present, color: "text-emerald-600 bg-emerald-50" },
                { label: "Late", val: summary.late, color: "text-amber-600 bg-amber-50" },
                { label: "Half Day", val: summary.half_day, color: "text-orange-600 bg-orange-50" },
                { label: "Absent", val: summary.absent, color: "text-rose-600 bg-rose-50" },
                { label: "Leave", val: summary.leave, color: "text-sky-600 bg-sky-50" },
                { label: "Holiday", val: summary.holiday, color: "text-violet-600 bg-violet-50" },
                { label: "Weekend", val: summary.weekend, color: "text-slate-500 bg-slate-50" },
                { label: "Hours", val: summary.totalWorkingHours.toFixed(1), color: "text-indigo-600 bg-indigo-50" },
              ].map(({ label, val, color }) => (
                <div key={label} className={`rounded-lg p-2 text-center ${color}`}>
                  <p className="text-lg font-bold">{val}</p>
                  <p className="text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day Detail Drawer */}
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDay(null)} />
            <div className="relative z-10 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {new Date(selectedDay.date).toLocaleDateString("en-AE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
                  </h3>
                  {selectedDay.isHoliday && selectedDay.holidayName && (
                    <p className="text-xs text-violet-600 mt-0.5">{selectedDay.holidayName}</p>
                  )}
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedDay.attendance ? (
                  <Badge className={`text-sm px-3 py-1 ${ATTENDANCE_STATUS_COLORS[selectedDay.attendance.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {selectedDay.attendance.status.replace("_", " ")}
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 text-sm px-3 py-1">No Record</Badge>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Check-in</p>
                    <p className="font-medium text-slate-900">{formatTime(selectedDay.attendance?.checkInTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Check-out</p>
                    <p className="font-medium text-slate-900">{formatTime(selectedDay.attendance?.checkOutTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Working Hours</p>
                    <p className="font-medium text-slate-900">
                      {selectedDay.attendance?.workingHours != null ? `${Number(selectedDay.attendance.workingHours).toFixed(1)}h` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Manual Override</p>
                    <p className="font-medium text-slate-900">{selectedDay.attendance?.isManualOverride ? "Yes" : "No"}</p>
                  </div>
                </div>

                {selectedDay.attendance?.notes && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Notes</p>
                    <p className="text-sm text-slate-700">{selectedDay.attendance.notes}</p>
                  </div>
                )}

                {selectedDay.hasPendingRegularization && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700">A correction request is pending for this date</p>
                  </div>
                )}

                {selectedDay.isHoliday && (
                  <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                    <p className="text-xs text-violet-700">{selectedDay.holidayName ?? "Public Holiday"}</p>
                  </div>
                )}
              </div>

              {/* Footer action */}
              {!selectedDay.isWeekend && !selectedDay.isHoliday &&
                selectedDay.date <= new Date().toISOString().split("T")[0] &&
                !selectedDay.hasPendingRegularization && (
                <div className="border-t border-slate-200 p-4">
                  <button
                    onClick={() => {
                      setSelectedDay(null);
                      router.push(`/my-hr/attendance-correction?date=${selectedDay.date}&attendanceId=${selectedDay.attendance?.id ?? ""}&currentStatus=${selectedDay.attendance?.status ?? ""}`);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Request Correction
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AccessGuard>
  );
}
