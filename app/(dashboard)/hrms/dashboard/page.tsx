"use client";

import { Users2, UserCheck, CalendarX, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { useEmployeeList, useLeaveList, useAttendanceList, useRegularizationList } from "@/hooks/useHrms";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { AccessGuard } from "@/components/shared/Guards";

export default function HrDashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const { data: employees, isLoading: empLoading } = useEmployeeList({ pageSize: 1 });
  const { data: pendingLeaves, isLoading: leaveLoading } = useLeaveList({ status: "pending", pageSize: 1 });
  const { data: todayAttendance, isLoading: attLoading } = useAttendanceList({ dateFrom: today, dateTo: today, pageSize: 1 });
  const { data: pendingCorrections } = useRegularizationList({ status: "pending", pageSize: 1 });
  const { data: approvedCorrections } = useRegularizationList({ status: "approved", pageSize: 1 });
  const { data: rejectedCorrections } = useRegularizationList({ status: "rejected", pageSize: 1 });

  return (
    <AccessGuard module="hrms" page="employees">
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" subtitle="Overview of workforce analytics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Employees" value={employees?.total ?? 0} icon={Users2} loading={empLoading} href="/hrms/employees" />
        <StatCard label="Pending Leaves" value={pendingLeaves?.total ?? 0} icon={CalendarX} accent="amber" loading={leaveLoading} href="/hrms/leave" />
        <StatCard label="Today Records" value={todayAttendance?.total ?? 0} icon={UserCheck} accent="emerald" loading={attLoading} href="/hrms/attendance" />
      </div>

      {/* Attendance Correction Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Attendance Correction Summary</h3>
          <a href="/hrms/attendance/regularization" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all →
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending Requests" value={pendingCorrections?.total ?? 0} icon={RotateCcw} accent="amber" href="/hrms/attendance/regularization" />
          <StatCard label="Approved" value={approvedCorrections?.total ?? 0} icon={CheckCircle} accent="emerald" href="/hrms/attendance/regularization" />
          <StatCard label="Rejected" value={rejectedCorrections?.total ?? 0} icon={XCircle} accent="rose" href="/hrms/attendance/regularization" />
          <StatCard
            label="Total"
            value={(pendingCorrections?.total ?? 0) + (approvedCorrections?.total ?? 0) + (rejectedCorrections?.total ?? 0)}
            icon={RotateCcw}
            accent="indigo"
            href="/hrms/attendance/regularization"
          />
        </div>
      </div>
    </div>
    </AccessGuard>
  );
}
