"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useLeaveList, useReviewLeave } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { LEAVE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/shared/Guards";
import { Select } from "@/components/ui/Input";
import type { LeaveRequest } from "@/types";

export default function LeaveManagementPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");

  const { data, isLoading } = useLeaveList({ page, pageSize, status: status || undefined, leaveType: leaveType || undefined });
  const review = useReviewLeave();

  const handleApprove = (id: string) => {
    review.mutate({ id, status: "approved" }, { onSuccess: () => toast.success("Leave approved") });
  };

  const handleReject = (id: string) => {
    const reviewNote = prompt("Rejection reason:");
    if (reviewNote) review.mutate({ id, status: "rejected", reviewNote }, { onSuccess: () => toast.success("Leave rejected") });
  };

  const columns: Column<LeaveRequest>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "leaveType", header: "Type", render: (r) => r.leaveType.replace("_", " ") },
    { key: "dateFrom", header: "From", render: (r) => formatDate(r.dateFrom) },
    { key: "dateTo", header: "To", render: (r) => formatDate(r.dateTo) },
    { key: "totalDays", header: "Days", render: (r) => String(r.totalDays) },
    { key: "reason", header: "Reason", render: (r) => <span className="max-w-[200px] truncate block">{r.reason}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge className={LEAVE_STATUS_COLORS[r.status]}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "pending" ? (
          <div className="flex gap-1">
            <button onClick={() => handleApprove(r.id)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" title="Approve">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => handleReject(r.id)} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Reject">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <PermissionGuard permission="hrms.leave.manage">
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Manage employee leave requests"
        actions={null}
      />

      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 py-0 w-auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Select value={leaveType} onChange={(e) => { setLeaveType(e.target.value); setPage(1); }} className="h-10 py-0 w-auto">
          <option value="">All Types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="emergency">Emergency</option>
          <option value="unpaid">Unpaid</option>
        </Select>
      </div>

      <DataTable<LeaveRequest>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
    </PermissionGuard>
  );
}
