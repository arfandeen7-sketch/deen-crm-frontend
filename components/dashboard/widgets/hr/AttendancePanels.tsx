"use client";

import Link from "next/link";
import { ChartFrame, ChartLegend } from "@/components/dashboard/charts/ChartFrame";
import { DonutBreakdown } from "@/components/dashboard/charts/DonutBreakdown";
import { StackedBarChart } from "@/components/dashboard/charts/StackedBarChart";
import { AreaTrendChart } from "@/components/dashboard/charts/AreaTrendChart";
import { HorizontalBarChart } from "@/components/dashboard/charts/HorizontalBarChart";
import {
  ATTENDANCE_COLOR,
  SERIES,
  categoricalColor,
  formatBucketLabel,
  formatFullDate,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/charts/theme";
import { PanelHeading } from "../DashboardShell";
import type { HrAttendanceBreakdown, HrOverview, HrTrendPoint } from "@/types";

const ATTENDANCE_SERIES = [
  { key: "present", label: "Present", color: ATTENDANCE_COLOR.present },
  { key: "late", label: "Late", color: ATTENDANCE_COLOR.late },
  { key: "halfDay", label: "Half day", color: ATTENDANCE_COLOR.halfDay },
  { key: "absent", label: "Absent", color: ATTENDANCE_COLOR.absent },
  { key: "onLeave", label: "On leave", color: ATTENDANCE_COLOR.onLeave },
];

/** Today's attendance split, with the headcount total in the ring. */
export function AttendanceTodayPanel({
  attendance,
  loading,
  height = 240,
}: {
  attendance: HrAttendanceBreakdown | undefined;
  loading?: boolean;
  height?: number;
}) {
  const slices = attendance
    ? [
        { label: "Present", value: attendance.present, color: ATTENDANCE_COLOR.present },
        { label: "Late", value: attendance.late, color: ATTENDANCE_COLOR.late },
        { label: "Half day", value: attendance.halfDay, color: ATTENDANCE_COLOR.halfDay },
        { label: "Absent", value: attendance.absent, color: ATTENDANCE_COLOR.absent },
        { label: "On leave", value: attendance.onLeave, color: ATTENDANCE_COLOR.onLeave },
        {
          label: "Not checked in",
          value: attendance.notCheckedIn,
          color: ATTENDANCE_COLOR.notCheckedIn,
        },
      ]
    : [];

  return (
    <ChartFrame
      title="Attendance Today"
      subtitle={
        attendance
          ? `${formatPercent(attendance.attendanceRate, 0)} of expected staff are in`
          : "Live headcount split"
      }
      height={height}
      loading={loading}
      isEmpty={slices.every((s) => s.value === 0)}
      emptyMessage="No attendance recorded for this day"
      legend={
        <ChartLegend
          items={slices
            .filter((s) => s.value > 0)
            .map((s) => ({ label: s.label, color: s.color, value: String(s.value) }))}
        />
      }
    >
      <DonutBreakdown data={slices} centerLabel="staff" />
    </ChartFrame>
  );
}

/** 30-day attendance composition, so a bad day reads against the baseline. */
export function AttendanceTrendPanel({
  trend,
  loading,
  height = 260,
}: {
  trend: HrTrendPoint[] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const data = trend ?? [];
  const isEmpty =
    data.length === 0 ||
    data.every((d) => d.present + d.late + d.absent + d.halfDay + d.onLeave === 0);

  return (
    <ChartFrame
      title="Attendance Trend"
      subtitle="Daily composition over the last 30 days"
      height={height}
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage="No attendance history in this window"
      legend={<ChartLegend items={ATTENDANCE_SERIES} />}
    >
      <StackedBarChart
        data={data}
        series={ATTENDANCE_SERIES}
        xKey="date"
        xTickFormatter={(value) => formatBucketLabel(value, "day")}
        tooltipTitleFormatter={(label) => formatFullDate(String(label))}
      />
    </ChartFrame>
  );
}

/** Working-hours trend — the "are people actually here for a full day" view. */
export function WorkingHoursPanel({
  trend,
  loading,
  height = 220,
}: {
  trend: HrTrendPoint[] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const data = (trend ?? []).map((point) => ({
    bucket: point.date,
    hours: point.avgWorkingHours ?? 0,
    rate: point.attendanceRate,
  }));

  return (
    <ChartFrame
      title="Hours & Attendance Rate"
      subtitle="Average hours logged against daily attendance rate"
      height={height}
      loading={loading}
      isEmpty={data.length === 0 || data.every((d) => d.hours === 0)}
      emptyMessage="No check-out times recorded yet"
      legend={
        <ChartLegend
          items={[
            { label: "Avg hours", color: SERIES.ink },
            { label: "Attendance rate %", color: SERIES.revenue },
          ]}
        />
      }
    >
      <AreaTrendChart
        data={data}
        series={[
          {
            key: "hours",
            label: "Avg hours",
            color: SERIES.ink,
            format: (v) => `${v.toFixed(1)}h`,
          },
          {
            key: "rate",
            label: "Attendance rate",
            color: SERIES.revenue,
            format: (v) => formatPercent(v, 0),
          },
        ]}
      />
    </ChartFrame>
  );
}

/**
 * Punctuality panel: the company average check-in against the configured start
 * time, plus the individuals driving the late count.
 */
export function PunctualityPanel({
  punctuality,
  lateRate,
  loading,
}: {
  punctuality: HrOverview["punctuality"] | undefined;
  lateRate: number | undefined;
  loading?: boolean;
}) {
  const offenders = punctuality?.repeatLateOffenders ?? [];
  const avg = punctuality?.avgCheckInMinutes ?? null;
  const expected = punctuality?.expectedCheckInMinutes ?? null;
  const minutesLate = avg != null && expected != null ? avg - expected : null;

  return (
    <ChartFrame
      title="Punctuality"
      subtitle="Late arrivals over the last 30 days"
      height={240}
      loading={loading}
      isEmpty={offenders.length === 0}
      emptyMessage="Nobody has been late in the last 30 days"
      legend={
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-zinc-400">Avg check-in</span>
            <span className="font-secondary text-sm font-bold text-zinc-900">
              {avg == null
                ? "—"
                : `${String(Math.floor(avg / 60)).padStart(2, "0")}:${String(
                    Math.round(avg % 60),
                  ).padStart(2, "0")}`}
            </span>
          </span>
          {minutesLate != null && (
            <span
              className={
                minutesLate > 0
                  ? "text-[11px] font-bold text-amber-700"
                  : "text-[11px] font-bold text-teal-700"
              }
            >
              {minutesLate > 0
                ? `${Math.round(minutesLate)} min after start time`
                : `${Math.abs(Math.round(minutesLate))} min before start time`}
            </span>
          )}
          {lateRate != null && (
            <span className="text-[11px] text-zinc-400">
              {formatPercent(lateRate, 0)} of today&apos;s arrivals were late
            </span>
          )}
        </div>
      }
    >
      <HorizontalBarChart
        data={offenders.map((o) => ({
          label: o.fullName,
          value: o.lateDays,
          meta: o.department ?? undefined,
          color: SERIES.riskSoft,
        }))}
        valueFormatter={(v) => `${formatNumber(v)} days`}
        showRank
      />
    </ChartFrame>
  );
}

/** Headcount composition by department. */
export function HeadcountPanel({
  headcount,
  loading,
  height = 240,
}: {
  headcount: HrOverview["headcount"] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const departments = headcount?.byDepartment ?? [];

  return (
    <ChartFrame
      title="Headcount"
      subtitle={
        headcount
          ? `${formatNumber(headcount.total)} active · ${formatNumber(
              headcount.newJoiners30d,
            )} joined in 30 days`
          : "Active employees by department"
      }
      height={height}
      loading={loading}
      isEmpty={departments.length === 0}
      emptyMessage="No active employees on record"
      action={
        <Link
          href="/hrms/employees"
          className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
        >
          Directory
        </Link>
      }
    >
      <div className="h-full overflow-y-auto pr-1">
        <HorizontalBarChart
          data={departments.map((d, i) => ({
            label: d.department,
            value: d.count,
            color: categoricalColor(i),
          }))}
          valueFormatter={formatNumber}
        />
      </div>
    </ChartFrame>
  );
}

/** Leave utilisation over the last 30 days, by leave type. */
export function LeaveUtilisationPanel({
  utilisation,
  loading,
  height = 220,
}: {
  utilisation: HrOverview["leave"]["utilisation"] | undefined;
  loading?: boolean;
  height?: number;
}) {
  const rows = utilisation ?? [];

  return (
    <ChartFrame
      title="Leave Taken"
      subtitle="Approved leave days in the last 30 days"
      height={height}
      loading={loading}
      isEmpty={rows.length === 0}
      emptyMessage="No approved leave in the last 30 days"
    >
      <HorizontalBarChart
        data={rows.map((row, i) => ({
          label: row.leaveType.replace(/_/g, " "),
          value: row.days,
          meta: `${row.requests} request${row.requests === 1 ? "" : "s"}`,
          color: categoricalColor(i),
        }))}
        valueFormatter={(v) => `${v} days`}
      />
    </ChartFrame>
  );
}

/** Payroll progress for the current month. */
export function PayrollPanel({
  payroll,
  headcount,
  loading,
}: {
  payroll: HrOverview["payroll"] | undefined;
  headcount: number | undefined;
  loading?: boolean;
}) {
  const total = headcount ?? 0;
  const done = (payroll?.generated ?? 0) + (payroll?.sent ?? 0);
  const monthName = payroll
    ? new Date(Date.UTC(payroll.year, payroll.month - 1, 1)).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric", timeZone: "UTC" },
      )
    : "";

  const steps = [
    { label: "Sent", value: payroll?.sent ?? 0, color: ATTENDANCE_COLOR.present },
    { label: "Generated", value: payroll?.generated ?? 0, color: SERIES.graphite },
    { label: "Draft", value: payroll?.draft ?? 0, color: ATTENDANCE_COLOR.late },
    { label: "Not started", value: payroll?.missing ?? 0, color: SERIES.hairline },
  ];

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title="Payroll Progress"
        subtitle={monthName || "Current month"}
        href="/hrms/payroll"
      />

      <div className="mt-4 flex-1">
        <p className="font-secondary text-3xl font-extrabold tracking-tight text-zinc-900">
          {loading ? "…" : `${done}`}
          <span className="ml-1 text-base font-bold text-zinc-400">of {total}</span>
        </p>
        <p className="mt-0.5 text-xs font-medium text-zinc-500">
          payslips generated or sent
        </p>

        {/* Single stacked bar: the whole payroll cycle at a glance. */}
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          {steps.map((step) =>
            step.value > 0 && total > 0 ? (
              <span
                key={step.label}
                title={`${step.label}: ${step.value}`}
                style={{
                  width: `${(step.value / total) * 100}%`,
                  backgroundColor: step.color,
                }}
              />
            ) : null,
          )}
        </div>

        <ChartLegend
          className="mt-3"
          items={steps
            .filter((s) => s.value > 0)
            .map((s) => ({ label: s.label, color: s.color, value: String(s.value) }))}
        />

        {payroll && payroll.totalNetSalary > 0 && (
          <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
            Net payroll so far{" "}
            <span className="font-bold text-zinc-900">
              AED {Math.round(payroll.totalNetSalary).toLocaleString()}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
