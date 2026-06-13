"use client";

import { useState } from "react";
import { Download, Check, X } from "lucide-react";
import { useLeaveList, useApproveLeave, useRejectLeave } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { LEAVE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { leaveService } from "@/services/hrms/leave.service";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { LeaveRequest } from "@/types";

export default function LeaveManagementPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [leaveType, setLeaveType] = useState("");

  const { data, isLoading } = useLeaveList({ page, pageSize, status: status || undefined, leaveType: leaveType || undefined });
  const approve = useApproveLeave();
  const reject = useRejectLeave();

  const handleApprove = (id: string) => {
    approve.mutate(id, { onSuccess: () => toast.success("Leave approved") });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason) reject.mutate({ id, reason }, { onSuccess: () => toast.success("Leave rejected") });
  };

  const handleExport = async () => {
    const blob = await leaveService.export({ status, leaveType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leave-records.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<LeaveRequest>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "leaveType", header: "Type", render: (r) => r.leaveType.replace("_", " ") },
    { key: "startDate", header: "From", render: (r) => formatDate(r.startDate) },
    { key: "endDate", header: "To", render: (r) => formatDate(r.endDate) },
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
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Manage employee leave requests"
        actions={
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={leaveType} onChange={(e) => { setLeaveType(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="emergency">Emergency</option>
          <option value="unpaid">Unpaid</option>
        </select>
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
  );
}
