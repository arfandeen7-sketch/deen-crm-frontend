"use client";

import { Users2, UserCheck, CalendarX } from "lucide-react";
import { useEmployeeList, useLeaveList, useAttendanceList } from "@/hooks/useHrms";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PermissionGuard } from "@/components/shared/Guards";

export default function HrDashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const { data: employees, isLoading: empLoading } = useEmployeeList({ pageSize: 1 });
  const { data: pendingLeaves, isLoading: leaveLoading } = useLeaveList({ status: "pending", pageSize: 1 });
  const { data: todayAttendance, isLoading: attLoading } = useAttendanceList({ dateFrom: today, dateTo: today, pageSize: 1 });

  return (
    <PermissionGuard permission="hrms.employees">
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" subtitle="Overview of workforce analytics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Employees" value={employees?.total ?? 0} icon={Users2} loading={empLoading} href="/hrms/employees" />
        <StatCard label="Pending Leaves" value={pendingLeaves?.total ?? 0} icon={CalendarX} accent="amber" loading={leaveLoading} href="/hrms/leave" />
        <StatCard label="Today Records" value={todayAttendance?.total ?? 0} icon={UserCheck} accent="emerald" loading={attLoading} href="/hrms/attendance" />
      </div>
    </div>
    </PermissionGuard>
  );
}
