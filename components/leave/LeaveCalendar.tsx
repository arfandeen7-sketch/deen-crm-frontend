"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calendarDayColors,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDateKey,
  findCalendarDay,
  MONTH_NAMES,
} from "@/lib/leaveUtils";
import type { LeaveCalendarDay } from "@/types";
import { LeaveCalendarDayPopover } from "./LeaveCalendarDayPopover";

interface LeaveCalendarProps {
  days: LeaveCalendarDay[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  mini?: boolean;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LeaveCalendar({
  days,
  month,
  year,
  onMonthChange,
  mini = false,
}: LeaveCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<LeaveCalendarDay | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) onMonthChange(11, year - 1);
    else onMonthChange(month - 1, year);
  };

  const nextMonth = () => {
    if (month === 11) onMonthChange(0, year + 1);
    else onMonthChange(month + 1, year);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={cn("rounded-xl border border-border bg-background", mini && "text-xs")}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={prevMonth}
          className="rounded p-1 text-foreground-muted hover:bg-panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="rounded p-1 text-foreground-muted hover:bg-panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className={cn(
              "py-2 text-center text-[10px] font-semibold uppercase text-foreground-muted",
              mini && "py-1",
            )}
          >
            {d.slice(0, mini ? 1 : 3)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="bg-background" />;
          }
          const dateKey = formatDateKey(year, month, day);
          const dayData = findCalendarDay(days, dateKey);
          const colorClass = dayData
            ? calendarDayColors[dayData.type] || ""
            : "bg-background text-foreground";
          const isLeave = dayData?.type === "leave";

          return (
            <button
              key={idx}
              onClick={() => dayData && setSelectedDay(dayData)}
              className={cn(
                "relative bg-background text-center transition-colors hover:bg-panel",
                mini ? "h-8 text-[10px]" : "h-12 text-xs",
                colorClass,
                !dayData && "cursor-default",
              )}
              disabled={!dayData}
            >
              <span className={cn(mini && "text-[10px]")}>{day}</span>
              {isLeave && dayData?.leaveTypeCode && (
                <span
                  className={cn(
                    "absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded px-1 text-[8px] font-bold",
                    mini && "hidden",
                  )}
                >
                  {dayData.leaveTypeCode.slice(0, 4)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {!mini && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
          {Object.entries(calendarDayColors).map(([type, cls]) => (
            <div key={type} className="flex items-center gap-1">
              <span className={cn("h-3 w-3 rounded", cls)} />
              <span className="text-[10px] text-foreground-muted">
                {type.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Day popover */}
      {selectedDay && (
        <LeaveCalendarDayPopover
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
