"use client";

import { useState } from "react";
import { Check, X, Paperclip, Eye } from "lucide-react";
import { useLeaveList, useReviewLeave, useLeaveTypeList, useCancelLeave } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Textarea } from "@/components/ui/Input";
import { LEAVE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useAuth } from "@/hooks/useAuth";
import { Select } from "@/components/ui/Input";
import type { LeaveRequest } from "@/types";

export default function LeaveManagementPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [leaveTypeCode, setLeaveTypeCode] = useState("");
  const { canAction } = useAuth();

  const { data, isLoading } = useLeaveList({ page, pageSize, status: status || undefined, leaveTypeCode: leaveTypeCode || undefined });
  const { data: leaveTypes } = useLeaveTypeList();
  const review = useReviewLeave();
  const cancelLeave = useCancelLeave();

  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [detailTarget, setDetailTarget] = useState<LeaveRequest | null>(null);

  const handleApprove = (id: string) => {
    review.mutate({ id, status: "approved" }, {
      onSuccess: () => toast.success("Leave approved"),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to approve";
        toast.error(msg);
      },
    });
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    review.mutate({ id: rejectTarget.id, status: "rejected", reviewNote: rejectNote }, {
      onSuccess: () => {
        toast.success("Leave rejected");
        setRejectTarget(null);
        setRejectNote("");
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to reject";
        toast.error(msg);
      },
    });
  };

  function handleCancelLeave() {
    if (!cancelTarget) return;
    cancelLeave.mutate({ id: cancelTarget.id }, {
      onSuccess: () => {
        toast.success("Leave cancelled");
        setCancelTarget(null);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to cancel";
        toast.error(msg);
      },
    });
  }

  const columns: Column<LeaveRequest>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    {
      key: "leaveType",
      header: "Type",
      render: (r) => r.leaveTypeConfig?.name ?? r.leaveType.replace("_", " "),
    },
    { key: "dateFrom", header: "From", render: (r) => formatDate(r.dateFrom) },
    { key: "dateTo", header: "To", render: (r) => formatDate(r.dateTo) },
    {
      key: "totalDays",
      header: "Days",
      render: (r) => (r.isHalfDay ? `${r.totalDays} (Half)` : String(r.totalDays)),
    },
    { key: "reason", header: "Reason", render: (r) => <span className="max-w-50 truncate block">{r.reason ?? "—"}</span> },
    {
      key: "attachment",
      header: "Attach.",
      render: (r) => (r.attachmentUrl ? <Paperclip className="h-4 w-4 text-foreground-muted" /> : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge className={LEAVE_STATUS_COLORS[r.status]}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => setDetailTarget(r)} className="rounded p-1 text-foreground-secondary hover:bg-panel" title="View Details">
            <Eye className="h-4 w-4" />
          </button>
          {r.status === "pending" && canAction("hrms", "leave", "approve") && (
            <button onClick={() => handleApprove(r.id)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" title="Approve">
              <Check className="h-4 w-4" />
            </button>
          )}
          {r.status === "pending" && canAction("hrms", "leave", "reject") && (
            <button onClick={() => { setRejectTarget(r); setRejectNote(""); }} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Reject">
              <X className="h-4 w-4" />
            </button>
          )}
          {(r.status === "pending" || r.status === "approved") && canAction("hrms", "leave", "cancel") && (
            <button onClick={() => setCancelTarget(r)} className="rounded p-1 text-amber-600 hover:bg-amber-50" title="Cancel Leave">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AccessGuard module="hrms" page="leave" action="view">
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
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select value={leaveTypeCode} onChange={(e) => { setLeaveTypeCode(e.target.value); setPage(1); }} className="h-10 py-0 w-auto">
          <option value="">All Types</option>
          {leaveTypes?.map((t) => (
            <option key={t.code} value={t.code}>{t.name}</option>
          ))}
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

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Leave Request"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={review.isPending}>Reject</Button>
          </>
        }
      >
        <Field label="Rejection Reason" required>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Provide a reason for rejection…"
          />
        </Field>
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelLeave}
        title="Cancel Leave Request?"
        message={
          cancelTarget?.status === "approved"
            ? "This approved leave will be cancelled and the employee's balance will be restored."
            : "This leave request will be cancelled."
        }
        confirmLabel="Yes, Cancel"
        loading={cancelLeave.isPending}
        danger
      />

      {/* Detail Modal */}
      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Leave Request Details"
        size="md"
        footer={<Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>}
      >
        {detailTarget && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Employee</p>
                <p className="text-foreground">{detailTarget.user?.fullName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Leave Type</p>
                <p className="text-foreground">{detailTarget.leaveTypeConfig?.name ?? detailTarget.leaveType.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">From</p>
                <p className="text-foreground">{formatDate(detailTarget.dateFrom)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">To</p>
                <p className="text-foreground">{formatDate(detailTarget.dateTo)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Days</p>
                <p className="text-foreground">{detailTarget.isHalfDay ? `${detailTarget.totalDays} (Half Day)` : detailTarget.totalDays}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Status</p>
                <Badge className={LEAVE_STATUS_COLORS[detailTarget.status]}>{detailTarget.status}</Badge>
              </div>
            </div>
            {detailTarget.reason && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Reason</p>
                <p className="text-foreground-secondary">{detailTarget.reason}</p>
              </div>
            )}
            {detailTarget.reviewNote && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Review Note</p>
                <p className="text-foreground-secondary">{detailTarget.reviewNote}</p>
              </div>
            )}
            {detailTarget.attachmentUrl && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Attachment</p>
                <a
                  href="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const { leaveService } = await import("@/services/hrms/leave.service");
                      const { signedUrl } = await leaveService.getAttachmentUrl(detailTarget.id);
                      window.open(signedUrl, "_blank");
                    } catch {
                      toast.error("Failed to load attachment");
                    }
                  }}
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  <Paperclip className="h-4 w-4" /> View Attachment
                </a>
              </div>
            )}
            {detailTarget.cancellationReason && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Cancellation Reason</p>
                <p className="text-foreground-secondary">{detailTarget.cancellationReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
    </AccessGuard>
  );
}
