"use client";

import { Users2, UserCheck, UserX, Clock, LogIn, CalendarX, DollarSign, CheckCircle2 } from "lucide-react";
import { useHrDashboard } from "@/hooks/useHrms";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";

export default function HrDashboardPage() {
  const { data, isLoading } = useHrDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" subtitle="Overview of workforce analytics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={data?.totalEmployees ?? 0} icon={Users2} loading={isLoading} href="/hrms/employees" />
        <StatCard label="Present Today" value={data?.presentToday ?? 0} icon={UserCheck} accent="emerald" loading={isLoading} href="/hrms/attendance" />
        <StatCard label="Absent Today" value={data?.absentToday ?? 0} icon={UserX} accent="rose" loading={isLoading} href="/hrms/attendance" />
        <StatCard label="Late Employees" value={data?.lateToday ?? 0} icon={Clock} accent="amber" loading={isLoading} href="/hrms/attendance" />
        <StatCard label="Logged In Users" value={data?.loggedInUsers ?? 0} icon={LogIn} accent="sky" loading={isLoading} href="/hrms/login-activity" />
        <StatCard label="Pending Leaves" value={data?.pendingLeaves ?? 0} icon={CalendarX} accent="amber" loading={isLoading} href="/hrms/leave" />
        <StatCard label="Payroll Pending" value={data?.payrollPending ?? 0} icon={DollarSign} accent="rose" loading={isLoading} href="/hrms/payroll" />
        <StatCard label="Payroll Processed" value={data?.payrollProcessed ?? 0} icon={CheckCircle2} accent="emerald" loading={isLoading} href="/hrms/payroll" />
      </div>
    </div>
  );
}
