"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/Avatar";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { cn, formatDate } from "@/lib/utils";
import {
  useEmployeeList,
  useAttendanceList,
  useLeaveList,
  usePayslipList,
} from "@/hooks/useHrms";
import { ROLE_QUICK_ACTIONS } from "@/constants/dashboard";
import { LEAVE_STATUS_COLORS } from "@/constants";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function currentMonth(): number {
  return new Date().getMonth() + 1;
}

function currentYear(): number {
  return new Date().getFullYear();
}

export function HrManagerDashboard() {
  const today = todayISO();

  const employees = useEmployeeList({ page: 1, pageSize: 1 });
  const todayAttendance = useAttendanceList({ dateFrom: today, dateTo: today, pageSize: 100 });
  const pendingLeaves = useLeaveList({ status: "pending", pageSize: 4 });
  const payslips = usePayslipList({ month: currentMonth(), year: currentYear(), pageSize: 100 });

  const attendanceRecords = todayAttendance.data?.data ?? [];
  const attendanceCounts: Record<string, number> = {
    present: 0,
    late: 0,
    absent: 0,
    half_day: 0,
    leave: 0,
  };
  attendanceRecords.forEach((r) => {
    const status = r.status as string;
    if (attendanceCounts[status] !== undefined) {
      attendanceCounts[status]++;
    }
  });

  const pendingPayslips = (payslips.data?.data ?? []).filter((p) => p.status === "draft").length;
  const processedPayslips = (payslips.data?.data ?? []).filter((p) => p.status !== "draft").length;

  const pendingLeaveList = pendingLeaves.data?.data ?? [];
  const quickActions = ROLE_QUICK_ACTIONS.hr_manager;

  const attendanceBreakdown = [
    { label: "Present", count: attendanceCounts.present, color: "bg-emerald-500" },
    { label: "Late", count: attendanceCounts.late, color: "bg-orange-500" },
    { label: "Absent", count: attendanceCounts.absent, color: "bg-rose-500" },
    { label: "Half Day", count: attendanceCounts.half_day, color: "bg-amber-400" },
    { label: "On Leave", count: attendanceCounts.leave, color: "bg-sky-500" },
  ];
  const maxAttendance = Math.max(...attendanceBreakdown.map((b) => b.count), 1);

  return (
    <div className="space-y-4 font-sans pb-12">
      {/* ── Top Stat Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 md:divide-x divide-neutral-200/80 pb-8 border-b border-neutral-200/80">
        <div className="flex flex-col justify-between pt-2 pb-4 pr-6 md:pl-0 md:pr-6 relative h-36">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Employees</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {employees.isLoading ? "..." : (employees.data?.total ?? 0)}
            </div>
          </div>
          <div className="h-1 bg-black absolute bottom-0 left-0 right-0 md:left-0 md:right-6 rounded-full" />
        </div>

        <div className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Present Today</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {todayAttendance.isLoading ? "..." : (attendanceCounts.present + attendanceCounts.late + attendanceCounts.half_day).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-emerald-600 absolute bottom-0 left-6 right-6 rounded-full" />
        </div>

        <Link href="/hrms/leave" className="flex flex-col justify-between pt-2 pb-4 px-6 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Pending Leaves</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {pendingLeaves.isLoading ? "..." : (pendingLeaves.data?.total ?? 0).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-amber-500 absolute bottom-0 left-6 right-6 rounded-full" />
        </Link>

        <Link href="/hrms/payroll" className="flex flex-col justify-between pt-2 pb-4 pl-6 pr-0 relative h-36 hover:bg-neutral-50/60 transition-colors rounded-xl">
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Pending Payroll</span>
            <div className="text-4xl font-extrabold text-neutral-900 mt-2 tracking-tight">
              {payslips.isLoading ? "..." : pendingPayslips.toString().padStart(2, "0")}
            </div>
          </div>
          <div className="h-1 bg-red-600 absolute bottom-0 left-6 right-0 rounded-full" />
        </Link>
      </div>

      {/* ── Split Section 1: Attendance Overview & Pending Leave Requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8 border-b border-zinc-200">
        {/* Attendance Overview (left, 2/3) */}
        <div className="lg:col-span-2 flex flex-col min-h-[340px] pr-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Attendance Overview</h3>
            <p className="text-xs text-zinc-400 mt-1">Today&apos;s attendance breakdown</p>
          </div>

          <div className="mt-6 flex-1 space-y-4">
            {todayAttendance.isLoading ? (
              <LoadingState />
            ) : attendanceRecords.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <EmptyState title="No attendance records" message="Attendance data will appear here once employees check in." />
              </div>
            ) : (
              attendanceBreakdown.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-zinc-700 font-secondary">{item.label}</span>
                    <span className="text-2xl font-bold text-zinc-900 font-secondary tracking-tight">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", item.color)}
                      style={{ width: `${(item.count / maxAttendance) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Leave Requests (right, 1/3) */}
        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Pending Leaves</h3>
              <p className="text-xs text-zinc-400 mt-1">Awaiting review</p>
            </div>
            <Link href="/hrms/leave" className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors">
              View all
            </Link>
          </div>

          <div className="mt-4 flex-1 divide-y divide-zinc-100">
            {pendingLeaves.isLoading ? (
              <LoadingState />
            ) : pendingLeaveList.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <EmptyState title="No pending leaves" message="All caught up! 🎉" />
              </div>
            ) : (
              pendingLeaveList.slice(0, 4).map((leave) => (
                <Link
                  key={leave.id}
                  href="/hrms/leave"
                  className="flex items-center gap-3 py-3.5 hover:bg-zinc-50/50 px-2 rounded-2xl transition-colors group"
                >
                  <UserAvatar name={leave.user?.fullName} size="sm" className="w-10 h-10 shrink-0 ring-2 ring-zinc-50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate font-secondary group-hover:text-zinc-950">
                      {leave.user?.fullName ?? "Unknown"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 capitalize">
                      {leave.leaveType} · {formatDate(leave.dateFrom)}
                      {leave.dateTo !== leave.dateFrom ? ` – ${formatDate(leave.dateTo)}` : ""}
                    </p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold tracking-wide shrink-0",
                    LEAVE_STATUS_COLORS[leave.status] ?? "bg-zinc-100 text-zinc-600"
                  )}>
                    Review
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Split Section 2: Payroll Summary & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-8">
        <div className="lg:col-span-2 flex flex-col min-h-[340px] pr-4">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Payroll This Month</h3>
            <p className="text-xs text-zinc-400 mt-1">
              {new Date(currentYear(), currentMonth() - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="mt-6 flex-1 flex flex-col justify-center space-y-6">
            {payslips.isLoading ? (
              <LoadingState />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-zinc-400 font-secondary">Pending</span>
                    <div className="text-4xl font-bold text-amber-600 font-secondary tracking-tight">
                      {pendingPayslips}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-zinc-400 font-secondary">Processed</span>
                    <div className="text-4xl font-bold text-emerald-600 font-secondary tracking-tight">
                      {processedPayslips}
                    </div>
                  </div>
                </div>
                <Link
                  href="/hrms/payroll"
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200/80 px-4 py-3 bg-white hover:bg-zinc-50/50 hover:border-zinc-300 transition-all shadow-sm text-sm font-bold text-zinc-700 font-secondary w-fit"
                >
                  Manage Payroll
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col min-h-[340px] lg:pl-8 border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Quick Actions</h3>
            <p className="text-xs text-zinc-400 mt-1">Frequent tools</p>
          </div>

          <div className="mt-4 flex-1 flex flex-col justify-center space-y-3">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 p-3.5 bg-white hover:bg-zinc-50/50 hover:border-zinc-300 transition-all shadow-sm group"
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105", a.accent)}>
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-zinc-700 font-secondary transition-colors group-hover:text-zinc-900">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
