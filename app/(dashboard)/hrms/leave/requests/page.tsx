"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLeaveList, useLeaveTypes } from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveRequestTable } from "@/components/leave/LeaveRequestTable";
import { LeaveReviewDialog } from "@/components/leave/LeaveReviewDialog";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { LeaveRequest } from "@/types";

export default function HrLeaveRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAction } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [leaveTypeCode, setLeaveTypeCode] = useState("");
  const [reviewTarget, setReviewTarget] = useState<LeaveRequest | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");

  const { data, isLoading } = useLeaveList({
    page,
    pageSize,
    status: status || undefined,
    leaveTypeCode: leaveTypeCode || undefined,
  });
  const { data: types } = useLeaveTypes(true);

  const canApprove = canAction("hrms", "leave", "approve");
  const canReject = canAction("hrms", "leave", "reject");

  const openReview = (req: LeaveRequest, mode: "approve" | "reject") => {
    setReviewTarget(req);
    setReviewMode(mode);
  };

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Requests"
          subtitle="Review and manage employee leave requests"
        />

        <div className="flex flex-wrap gap-3">
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 py-0 w-auto"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={leaveTypeCode}
            onChange={(e) => { setLeaveTypeCode(e.target.value); setPage(1); }}
            className="h-10 py-0 w-auto"
          >
            <option value="">All Types</option>
            {types?.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>

        <LeaveRequestTable
          rows={data?.data ?? []}
          loading={isLoading}
          showEmployee
          canApprove={canApprove}
          canReject={canReject}
          onApprove={(id) => {
            const req = data?.data.find((r) => r.id === id);
            if (req) openReview(req, "approve");
          }}
          onReject={(id) => {
            const req = data?.data.find((r) => r.id === id);
            if (req) openReview(req, "reject");
          }}
          detailBasePath="/hrms/leave"
        />

        {data && (
          <Pagination
            page={data.page}
            pageSize={pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        )}

        <LeaveReviewDialog
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          request={reviewTarget}
          mode={reviewMode}
        />
      </div>
    </AccessGuard>
  );
}
