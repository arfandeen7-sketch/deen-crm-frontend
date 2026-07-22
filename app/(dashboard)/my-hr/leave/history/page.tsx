"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMyLeaves, useLeaveTypes } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveRequestTable } from "@/components/leave/LeaveRequestTable";
import { DEFAULT_PAGE_SIZE } from "@/constants";

export default function LeaveHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [leaveTypeCode, setLeaveTypeCode] = useState("");

  const { data, isLoading } = useMyLeaves({
    page,
    pageSize,
    status: status || undefined,
    leaveTypeCode: leaveTypeCode || undefined,
  });
  const { data: types } = useLeaveTypes(true);

  return (
    <AccessGuard module="my_hr" page="my_leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave History"
          subtitle="View all your past leave requests"
          actions={
            <Button variant="outline" onClick={() => router.push("/my-hr/leave")}>
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          }
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
          detailBasePath="/my-hr/leave"
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
      </div>
    </AccessGuard>
  );
}
