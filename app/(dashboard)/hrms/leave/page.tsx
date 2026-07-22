"use client";

import { useRouter } from "next/navigation";
import { CalendarX, CalendarRange, Wallet, BarChart2, Settings, FileText } from "lucide-react";
import { useLeaveHrDashboard } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { HrLeaveSummaryWidget } from "@/components/leave/HrLeaveSummaryWidget";
import { LeaveRequestStatusBadge } from "@/components/leave/LeaveRequestStatusBadge";
import { formatDate } from "@/lib/utils";

export default function LeaveManagementPage() {
  const router = useRouter();
  const { data, isLoading } = useLeaveHrDashboard();

  const links = [
    { label: "Leave Requests", href: "/hrms/leave/requests", icon: CalendarX, desc: "Review and manage leave requests" },
    { label: "Calendar", href: "/hrms/leave/calendar", icon: CalendarRange, desc: "View team leave calendar" },
    { label: "Balances", href: "/hrms/leave/balance", icon: Wallet, desc: "View and adjust leave balances" },
    { label: "Reports", href: "/hrms/leave/reports", icon: BarChart2, desc: "Leave reports and analytics" },
    { label: "Settings", href: "/hrms/leave/settings", icon: Settings, desc: "Configure leave types" },
    { label: "Policy", href: "/hrms/leave/policy", icon: FileText, desc: "Leave policy configuration" },
  ];

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Management"
          subtitle="Manage employee leave requests and configurations"
        />

        {isLoading ? (
          <p className="text-sm text-foreground-muted">Loading dashboard…</p>
        ) : data ? (
          <HrLeaveSummaryWidget data={data} />
        ) : null}

        {/* Upcoming leaves on team */}
        {data && data.upcomingLeaves.length > 0 && (
          <Card>
            <CardHeader title="On Leave / Upcoming" />
            <CardBody>
              <div className="space-y-3">
                {data.upcomingLeaves.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.fullName}
                        {item.department && (
                          <span className="ml-2 text-xs text-foreground-muted">{item.department}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {item.leaveTypeName} · {formatDate(item.dateFrom)} — {formatDate(item.dateTo)} · {item.totalDays} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="rounded-xl border border-border bg-background p-5 text-left shadow-sm transition-colors hover:bg-panel"
              >
                <div className="inline-flex rounded-lg bg-accent/10 p-2 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{link.label}</p>
                <p className="mt-1 text-xs text-foreground-muted">{link.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </AccessGuard>
  );
}
