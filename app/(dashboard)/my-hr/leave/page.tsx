"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarDays, Clock, Check, X, CalendarRange } from "lucide-react";
import { useLeaveDashboard, useCancelLeave } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveBalanceCard } from "@/components/leave/LeaveBalanceCard";
import { LeaveRequestStatusBadge } from "@/components/leave/LeaveRequestStatusBadge";
import { LeaveCancelDialog } from "@/components/leave/LeaveCancelDialog";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import type { LeaveRequest } from "@/types";

export default function MyLeavePage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useLeaveDashboard();
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const cancel = useCancelLeave();

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancel.mutate(
      { id: cancelTarget.id },
      {
        onSuccess: () => {
          toast.success("Leave request cancelled");
          setCancelTarget(null);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const stats = [
    { label: "Pending", value: data?.pendingCount ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Approved", value: data?.approvedCount ?? 0, icon: Check, color: "text-emerald-600 bg-emerald-50" },
    { label: "Rejected", value: data?.rejectedCount ?? 0, icon: X, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <AccessGuard module="my_hr" page="my_leave">
      <div className="space-y-6">
        <PageHeader
          title="My Leave"
          subtitle="Apply for leave and track your requests"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/my-hr/leave/calendar")}>
                <CalendarRange className="h-4 w-4" /> Calendar
              </Button>
              <Button variant="outline" onClick={() => router.push("/my-hr/leave/history")}>
                <CalendarDays className="h-4 w-4" /> History
              </Button>
              <Button onClick={() => router.push("/my-hr/leave/apply")}>
                <Plus className="h-4 w-4" /> Apply Leave
              </Button>
            </div>
          }
        />

        {isLoading && <p className="text-sm text-foreground-muted">Loading dashboard…</p>}
        {isError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Failed to load dashboard.{" "}
            <button onClick={() => refetch()} className="font-medium underline">
              Try again
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label}>
                    <CardBody className="flex items-center gap-3">
                      <div className={`inline-flex rounded-lg p-2 ${s.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-foreground-muted">{s.label}</p>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            {/* Balances */}
            {data.balances.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Leave Balances</h3>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {data.balances.map((bal) => (
                    <LeaveBalanceCard key={bal.leaveTypeCode} balance={bal} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upcoming Leaves */}
              <Card>
                <CardHeader title="Upcoming Leaves" />
                <CardBody>
                  {data.upcomingLeaves.length === 0 ? (
                    <p className="py-6 text-center text-sm text-foreground-muted">
                      No upcoming leave requests.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data.upcomingLeaves.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {req.leaveType?.name || req.leaveTypeCode}
                              </span>
                              <LeaveRequestStatusBadge status={req.status} />
                            </div>
                            <p className="mt-1 text-xs text-foreground-muted">
                              {formatDate(req.dateFrom)} — {formatDate(req.dateTo)} · {req.totalDays} days
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/my-hr/leave/${req.id}`)}
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              View
                            </button>
                            {req.status === "pending" && (
                              <button
                                onClick={() => setCancelTarget(req)}
                                className="text-xs font-medium text-rose-500 hover:underline"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Mini Calendar */}
              <Card>
                <CardHeader title="Calendar" />
                <CardBody>
                  <LeaveCalendar
                    days={data.calendar.days}
                    month={calMonth}
                    year={calYear}
                    onMonthChange={(m, y) => {
                      setCalMonth(m);
                      setCalYear(y);
                    }}
                    mini
                  />
                </CardBody>
              </Card>
            </div>
          </>
        )}

        <LeaveCancelDialog
          open={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          request={cancelTarget}
        />
      </div>
    </AccessGuard>
  );
}
