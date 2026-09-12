"use client";

import Link from "next/link";
import { CakeSlice, CalendarDays, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiRow, KpiTile } from "@/components/dashboard/kpi/KpiTile";
import {
  DashboardHeader,
  DashboardSection,
  DashboardSplit,
  PanelHeading,
} from "@/components/dashboard/widgets/DashboardShell";
import { QuickActionsPanel } from "@/components/dashboard/widgets/QuickActionsPanel";
import {
  AttendanceTodayPanel,
  AttendanceTrendPanel,
  HeadcountPanel,
  LeaveUtilisationPanel,
  PayrollPanel,
  PunctualityPanel,
  WorkingHoursPanel,
} from "@/components/dashboard/widgets/hr/AttendancePanels";
import {
  formatClockMinutes,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/charts/theme";
import { Skeleton } from "@/components/ui/States";
import { useHrOverview, useHrTrend } from "@/hooks/useDashboardAnalytics";
import { EmployeeActivitySection } from "@/components/dashboard/EmployeeActivitySection";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { TodoListWidget } from "@/components/dashboard/TodoListWidget";
import type { HrOverview } from "@/types";

function formatDayRange(from: string, to: string): string {
  const options = { day: "numeric", month: "short", timeZone: "UTC" } as const;
  const start = new Date(`${from}T00:00:00Z`).toLocaleDateString("en-US", options);
  if (from === to) return start;
  const end = new Date(`${to}T00:00:00Z`).toLocaleDateString("en-US", options);
  return `${start} – ${end}`;
}

/** Approval queue — the HR manager's actual inbox, ordered oldest first. */
function ApprovalsPanel({
  overview,
  loading,
}: {
  overview: HrOverview | undefined;
  loading?: boolean;
}) {
  const approvals = overview?.approvals;
  const pending = overview?.leave.pending ?? [];
  const regularizations = approvals?.regularizationPending ?? 0;

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title="Awaiting My Approval"
        subtitle={
          loading
            ? "Loading queue"
            : `${approvals?.total ?? 0} item${(approvals?.total ?? 0) === 1 ? "" : "s"} pending`
        }
        href="/hrms/leave"
      />

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (approvals?.total ?? 0) === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-200 bg-teal-50/30 p-6 text-center">
            <CheckCheck className="h-5 w-5 text-teal-700" />
            <p className="text-xs font-bold text-zinc-700">Inbox clear</p>
            <p className="text-[11px] text-zinc-500">
              No leave requests or attendance corrections are waiting on you.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-zinc-100">
              {pending.map((leave) => (
                <li key={leave.id}>
                  <Link
                    href="/hrms/leave"
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-zinc-50/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-zinc-800">
                        {leave.fullName}
                      </span>
                      <span className="block truncate text-[11px] text-zinc-400">
                        {leave.leaveType.replace(/_/g, " ")} ·{" "}
                        {formatDayRange(leave.dateFrom, leave.dateTo)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs font-bold tabular-nums text-zinc-900">
                        {leave.totalDays}d
                      </span>
                      <span
                        className={cn(
                          "block text-[10px] font-bold uppercase tracking-wider",
                          leave.status === "hr_approved"
                            ? "text-teal-700"
                            : "text-amber-700",
                        )}
                      >
                        {leave.status === "hr_approved" ? "Final approval" : "New"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {regularizations > 0 && (
              <Link
                href="/hrms/attendance-corrections"
                className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3 py-2.5 transition-colors hover:bg-white"
              >
                <span className="text-xs font-medium text-zinc-700">
                  Attendance corrections to review
                </span>
                <span className="text-xs font-bold tabular-nums text-zinc-900">
                  {regularizations}
                </span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Upcoming approved leave and work anniversaries — the planning ahead panel. */
function LookAheadPanel({
  overview,
  loading,
}: {
  overview: HrOverview | undefined;
  loading?: boolean;
}) {
  const upcoming = overview?.leave.upcoming ?? [];
  const anniversaries = overview?.milestones.anniversaries ?? [];
  const isEmpty = upcoming.length === 0 && anniversaries.length === 0;

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title="Looking Ahead"
        subtitle="Approved leave and milestones in the next 30 days"
        href="/hrms/team-calendar"
      />

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 p-6">
            <p className="text-xs font-medium text-zinc-400">
              Nothing scheduled in the next two weeks
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <CalendarDays className="h-3 w-3" />
                  Upcoming leave
                </p>
                <ul className="divide-y divide-zinc-100">
                  {upcoming.map((leave) => (
                    <li
                      key={leave.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-zinc-800">
                          {leave.fullName}
                        </span>
                        <span className="block text-[11px] text-zinc-400">
                          {leave.leaveType.replace(/_/g, " ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[11px] font-bold text-zinc-700">
                          {formatDayRange(leave.dateFrom, leave.dateTo)}
                        </span>
                        <span className="block text-[10px] text-zinc-400">
                          {leave.totalDays} day{leave.totalDays === 1 ? "" : "s"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {anniversaries.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <CakeSlice className="h-3 w-3" />
                  Work anniversaries
                </p>
                <ul className="divide-y divide-zinc-100">
                  {anniversaries.map((person) => (
                    <li
                      key={person.userId}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="truncate text-xs font-semibold text-zinc-800">
                        {person.fullName}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold text-zinc-700">
                        {person.years} year{person.years === 1 ? "" : "s"}
                        <span className="ml-1 font-medium text-zinc-400">
                          {person.inDays === 0 ? "today" : `in ${person.inDays}d`}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HR manager dashboard — workforce health.
 *
 * No period selector: HR questions are "who is in today" and "what is waiting
 * on me", which are point-in-time. The trend charts carry their own fixed
 * 30-day window instead.
 */
export function HrManagerDashboard() {
  const overviewQuery = useHrOverview();
  const trendQuery = useHrTrend(30);

  const overview = overviewQuery.data;
  const loading = overviewQuery.isLoading;
  const attendance = overview?.attendance;

  const avgCheckIn = overview?.punctuality.avgCheckInMinutes ?? null;
  const expectedCheckIn = overview?.punctuality.expectedCheckInMinutes ?? null;

  return (
    <div className="pb-12 font-sans">
      <DashboardHeader
        title="Workforce Overview"
        subtitle="Attendance, approvals and payroll — live for today"
        showPeriodSelector={false}
      />

      <KpiRow>
        <KpiTile
          label="Headcount"
          value={formatNumber(overview?.headcount.total ?? 0)}
          hint={`${formatNumber(overview?.headcount.newJoiners30d ?? 0)} joined in 30 days`}
          accent="ink"
          href="/hrms/employees"
          loading={loading}
        />
        <KpiTile
          label="Attendance Rate"
          value={formatPercent(attendance?.attendanceRate ?? 0, 0)}
          hint={`${formatNumber(attendance?.present ?? 0)} present · ${formatNumber(
            attendance?.late ?? 0,
          )} late`}
          accent={(attendance?.attendanceRate ?? 100) < 85 ? "risk" : "revenue"}
          href="/hrms/attendance"
          loading={loading}
        />
        <KpiTile
          label="Absent Today"
          value={formatNumber(attendance?.absent ?? 0)}
          hint={`${formatNumber(attendance?.notCheckedIn ?? 0)} yet to check in`}
          accent={(attendance?.absent ?? 0) > 0 ? "negative" : "muted"}
          href="/hrms/attendance"
          loading={loading}
        />
        <KpiTile
          label="On Leave"
          value={formatNumber(attendance?.onLeave ?? 0)}
          hint={`${formatNumber(overview?.leave.upcoming.length ?? 0)} upcoming in 14 days`}
          accent="muted"
          href="/hrms/leave"
          loading={loading}
        />
        <KpiTile
          label="Avg Check-in"
          value={formatClockMinutes(avgCheckIn)}
          hint={
            expectedCheckIn != null
              ? `Start time ${formatClockMinutes(expectedCheckIn)}`
              : "No start time configured"
          }
          accent={
            avgCheckIn != null && expectedCheckIn != null && avgCheckIn > expectedCheckIn
              ? "risk"
              : "ink"
          }
          loading={loading}
        />
        <KpiTile
          label="Pending Approvals"
          value={formatNumber(overview?.approvals.total ?? 0)}
          hint={`${formatNumber(
            overview?.approvals.leavePending ?? 0,
          )} leave · ${formatNumber(
            overview?.approvals.regularizationPending ?? 0,
          )} corrections`}
          accent={(overview?.approvals.total ?? 0) > 0 ? "risk" : "muted"}
          href="/hrms/leave"
          loading={loading}
        />
      </KpiRow>

      {/* ── Today ── */}
      <DashboardSplit
        divider={false}
        primary={
          <AttendanceTrendPanel trend={trendQuery.data} loading={trendQuery.isLoading} />
        }
        secondary={
          <AttendanceTodayPanel attendance={attendance} loading={loading} />
        }
      />

      {/* ── My inbox ── */}
      <DashboardSplit
        primary={<ApprovalsPanel overview={overview} loading={loading} />}
        secondary={<LookAheadPanel overview={overview} loading={loading} />}
      />

      {/* ── Discipline signals ── */}
      <DashboardSplit
        primary={
          <PunctualityPanel
            punctuality={overview?.punctuality}
            lateRate={attendance?.lateRate}
            loading={loading}
          />
        }
        secondary={
          <WorkingHoursPanel trend={trendQuery.data} loading={trendQuery.isLoading} />
        }
      />

      {/* ── Organisation ── */}
      <DashboardSplit
        primary={<HeadcountPanel headcount={overview?.headcount} loading={loading} />}
        secondary={
          <LeaveUtilisationPanel
            utilisation={overview?.leave.utilisation}
            loading={loading}
          />
        }
      />

      {/* ── Payroll + personal ── */}
      <DashboardSplit
        primary={
          <PayrollPanel
            payroll={overview?.payroll}
            headcount={overview?.headcount.total}
            loading={loading}
          />
        }
        secondary={
          <div className="flex h-full flex-col gap-4">
            <AttendanceCheckInOut />
            <TodoListWidget />
          </div>
        }
      />

      {/* ── Per-employee detail ── */}
      <DashboardSection>
        <EmployeeActivitySection showLeadData={false} />
      </DashboardSection>

      <DashboardSection>
        <QuickActionsPanel role="hr_manager" layout="row" />
      </DashboardSection>
    </div>
  );
}
