"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { Holiday, CalendarLeaveEntry } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface SelectedDay {
  dateStr: string;
  day: number;
  holiday?: Holiday;
  leaves: CalendarLeaveEntry[];
}

export interface LeaveCalendarProps {
  year: number;
  month: number; // 1–12
  holidays: Holiday[];
  leaves: CalendarLeaveEntry[];
  canManageHolidays?: boolean;
  canApplyLeave?: boolean;
  onMonthChange: (year: number, month: number) => void;
  onAddHoliday?: (date: string) => void;
  onRemoveHoliday?: (holiday: Holiday) => void;
  onApplyLeave?: (date: string) => void;
  isLoading?: boolean;
}

export function LeaveCalendar({
  year,
  month,
  holidays,
  leaves,
  canManageHolidays = false,
  canApplyLeave = false,
  onMonthChange,
  onAddHoliday,
  onRemoveHoliday,
  onApplyLeave,
  isLoading = false,
}: LeaveCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  const holidayMap = useMemo(() => {
    const map: Record<string, Holiday> = {};
    for (const h of holidays) {
      const ds = h.date.split("T")[0];
      map[ds] = h;
    }
    return map;
  }, [holidays]);

  const leavesByDay = useMemo(() => {
    const map: Record<string, CalendarLeaveEntry[]> = {};
    for (const leave of leaves) {
      let cur = new Date(leave.dateFrom + "T00:00:00Z");
      const end = new Date(leave.dateTo + "T00:00:00Z");
      while (cur <= end) {
        const ds = cur.toISOString().split("T")[0];
        if (!map[ds]) map[ds] = [];
        map[ds].push(leave);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    return map;
  }, [leaves]);

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const handleDayClick = (day: number) => {
    const ds = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDay({
      dateStr: ds,
      day,
      holiday: holidayMap[ds],
      leaves: leavesByDay[ds] ?? [],
    });
  };

  const formatDetailDate = (ds: string) =>
    new Date(ds + "T00:00:00Z").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-panel/30 px-5 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-foreground-secondary transition-colors hover:bg-background hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[190px] text-center text-base font-semibold text-foreground">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-foreground-secondary transition-colors hover:bg-background hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              HR Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              Today
            </span>
          </div>
        </div>

        {/* ── Weekday headers ────────────────────────────────────────── */}
        <div className="grid grid-cols-7 border-b border-border bg-panel/20">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                "py-2 text-center text-[11px] font-semibold uppercase tracking-widest",
                i === 0 || i === 6 ? "text-rose-400/80" : "text-foreground-secondary",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Calendar grid ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-foreground-muted">
            Loading calendar…
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }, (_, i) => {
              const day = i - firstDayOfWeek + 1;
              const col = i % 7;
              const isOtherMonth = day < 1 || day > daysInMonth;

              if (isOtherMonth) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[90px] border-b border-r border-border/30 bg-panel/10 last:border-r-0"
                  />
                );
              }

              const ds = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = ds === todayStr;
              const holiday = holidayMap[ds];
              const dayLeaves = leavesByDay[ds] ?? [];
              const isWeekend = col === 0 || col === 6;
              const visibleLeaves = dayLeaves.slice(0, 2);
              const moreCount = dayLeaves.length - visibleLeaves.length;

              return (
                <div
                  key={ds}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleDayClick(day)}
                  onKeyDown={(e) => e.key === "Enter" && handleDayClick(day)}
                  className={cn(
                    "group min-h-[90px] cursor-pointer border-b border-r border-border/30 p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent last:border-r-0",
                    holiday
                      ? "bg-rose-50 hover:bg-rose-100/70"
                      : isWeekend
                        ? "bg-zinc-50/40 hover:bg-panel/60"
                        : "hover:bg-panel/40",
                    isToday && "ring-2 ring-inset ring-accent/70",
                  )}
                >
                  {/* Day number */}
                  <div className="mb-1 flex items-start justify-between">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold leading-none",
                        isToday
                          ? "bg-accent text-white"
                          : isWeekend
                            ? "text-rose-400/80"
                            : "text-foreground",
                      )}
                    >
                      {day}
                    </span>
                    {holiday && (
                      <span className="text-[10px] text-rose-500" title={holiday.name}>🗓</span>
                    )}
                  </div>

                  {/* Holiday name */}
                  {holiday && (
                    <div
                      className="mb-0.5 truncate rounded bg-rose-100 px-1 py-0.5 text-[10px] font-medium leading-tight text-rose-700"
                      title={holiday.name}
                    >
                      {holiday.name}
                    </div>
                  )}

                  {/* Leave chips */}
                  <div className="space-y-0.5">
                    {visibleLeaves.map((leave) => (
                      <div
                        key={leave.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight",
                          leave.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : leave.status === "hr_approved"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                        title={`${leave.userFullName} — ${leave.leaveTypeName ?? leave.leaveType}`}
                      >
                        {leave.userFullName.split(" ")[0]}
                        {leave.isHalfDay ? " ½" : ""}
                      </div>
                    ))}
                    {moreCount > 0 && (
                      <div className="px-1 text-[10px] font-medium text-foreground-muted">
                        +{moreCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Day Detail Modal ───────────────────────────────────────── */}
      {selectedDay && (
        <Modal
          open={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          title={formatDetailDate(selectedDay.dateStr)}
          size="sm"
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {canManageHolidays && !selectedDay.holiday && onAddHoliday && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onAddHoliday(selectedDay.dateStr);
                      setSelectedDay(null);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Holiday
                  </Button>
                )}
                {canManageHolidays && selectedDay.holiday && onRemoveHoliday && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      onRemoveHoliday(selectedDay.holiday!);
                      setSelectedDay(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove Holiday
                  </Button>
                )}
                {canApplyLeave && onApplyLeave && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onApplyLeave(selectedDay.dateStr);
                      setSelectedDay(null);
                    }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Apply Leave
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedDay(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Holiday info */}
            {selectedDay.holiday ? (
              <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                <span className="text-xl">🗓</span>
                <div>
                  <p className="text-sm font-semibold text-rose-700">{selectedDay.holiday.name}</p>
                  {selectedDay.holiday.isRecurring && (
                    <p className="mt-0.5 text-xs text-rose-500">Recurring holiday</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">No public holiday on this day.</p>
            )}

            {/* Employees on leave */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                On Leave ({selectedDay.leaves.length})
              </p>
              {selectedDay.leaves.length === 0 ? (
                <p className="text-sm text-foreground-muted">No employees on leave.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedDay.leaves.map((leave) => (
                    <li key={leave.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel text-xs font-bold text-foreground-secondary">
                          {leave.userFullName
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{leave.userFullName}</p>
                          <p className="text-xs text-foreground-muted">
                            {leave.leaveTypeName ?? leave.leaveType}
                            {leave.isHalfDay &&
                              ` · Half Day${leave.halfDayPeriod ? ` (${leave.halfDayPeriod.replace("_", " ")})` : ""}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 capitalize",
                          leave.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : leave.status === "hr_approved"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {leave.status === "hr_approved" ? "HR Approved" : leave.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
