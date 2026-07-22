"use client";

import { useRouter } from "next/navigation";
import { Check, X, Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { LeaveRequestStatusBadge } from "./LeaveRequestStatusBadge";
import { formatDate } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

interface LeaveRequestTableProps {
  rows: LeaveRequest[];
  loading?: boolean;
  showEmployee?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  detailBasePath: string;
}

export function LeaveRequestTable({
  rows,
  loading,
  showEmployee = false,
  canApprove = false,
  canReject = false,
  onApprove,
  onReject,
  detailBasePath,
}: LeaveRequestTableProps) {
  const router = useRouter();

  const columns: Column<LeaveRequest>[] = [
    ...(showEmployee
      ? [
          {
            key: "user",
            header: "Employee",
            render: (r: LeaveRequest) => r.user?.fullName || "—",
          },
        ]
      : []),
    {
      key: "leaveType",
      header: "Type",
      render: (r) => (
        <span className="flex items-center gap-2">
          {r.leaveType?.name || r.leaveTypeCode}
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {r.leaveTypeCode}
          </span>
        </span>
      ),
    },
    {
      key: "dateFrom",
      header: "From",
      render: (r) => formatDate(r.dateFrom),
    },
    {
      key: "dateTo",
      header: "To",
      render: (r) => formatDate(r.dateTo),
    },
    {
      key: "totalDays",
      header: "Days",
      render: (r) => String(r.totalDays),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <LeaveRequestStatusBadge status={r.status} />,
    },
    {
      key: "createdAt",
      header: "Applied",
      render: (r) => formatDate(r.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`${detailBasePath}/${r.id}`);
            }}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          {r.status === "pending" && canApprove && onApprove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(r.id);
              }}
              className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
              title="Approve"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {r.status === "pending" && canReject && onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(r.id);
              }}
              className="rounded p-1 text-rose-600 hover:bg-rose-50"
              title="Reject"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable<LeaveRequest>
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      loading={loading}
      onRowClick={(r) => router.push(`${detailBasePath}/${r.id}`)}
      emptyTitle="No leave requests"
      emptyMessage="No leave requests found."
    />
  );
}
