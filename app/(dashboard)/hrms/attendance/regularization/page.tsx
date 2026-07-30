"use client";

import { useState } from "react";
import { Check, X, Eye } from "lucide-react";
import {
  useRegularizationList,
  useReviewRegularization,
} from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Textarea, Select } from "@/components/ui/Input";
import { AccessGuard } from "@/components/shared/Guards";
import { useAuth } from "@/hooks/useAuth";
import {
  REGULARIZATION_STATUS_COLORS,
  REGULARIZATION_STATUS_LABELS,
  REGULARIZATION_REQUEST_TYPE_LABELS,
  ATTENDANCE_STATUS_COLORS,
  DEFAULT_PAGE_SIZE,
} from "@/constants";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import type { AttendanceRegularization } from "@/types";

const STATUS_OPTIONS = Object.entries(REGULARIZATION_STATUS_LABELS);
const REQUEST_TYPE_OPTIONS = Object.entries(REGULARIZATION_REQUEST_TYPE_LABELS);

function formatTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendanceRegularizationPage() {
  return (
    <AccessGuard module="hrms" page="attendance_regularization" action="view">
      <AttendanceRegularizationContent />
    </AccessGuard>
  );
}

function AttendanceRegularizationContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [requestType, setRequestType] = useState("");
  const [rejectTarget, setRejectTarget] = useState<AttendanceRegularization | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [approveTarget, setApproveTarget] = useState<AttendanceRegularization | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [detailTarget, setDetailTarget] = useState<AttendanceRegularization | null>(null);

  const { canAction, role } = useAuth();
  const { data, isLoading } = useRegularizationList({
    page,
    pageSize,
    status: status || undefined,
    requestType: requestType || undefined,
  });
  const review = useReviewRegularization();

  const canReview = (reqStatus: string) =>
    reqStatus === "pending" &&
    (role === "hr_manager" || role === "master") &&
    (canAction("hrms", "attendance_regularization", "approve") ||
      canAction("hrms", "attendance_regularization", "reject"));

  function handleApprove(id: string) {
    review.mutate(
      { id, status: "approved", reviewNote: approveNote || undefined },
      {
        onSuccess: () => {
          toast.success("Correction approved and attendance updated");
          setApproveTarget(null);
          setApproveNote("");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      }
    );
  }

  function handleReject() {
    if (!rejectTarget) return;
    review.mutate(
      { id: rejectTarget.id, status: "rejected", reviewNote: rejectNote || undefined },
      {
        onSuccess: () => {
          toast.success("Correction rejected");
          setRejectTarget(null);
          setRejectNote("");
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      }
    );
  }

  const columns: Column<AttendanceRegularization>[] = [
    {
      key: "user",
      header: "Employee",
      render: (r) => (
        <div className="text-sm">
          <div className="font-medium">{r.user?.fullName ?? "—"}</div>
          {r.user?.employeeId && (
            <div className="text-xs text-foreground-muted">{r.user.employeeId}</div>
          )}
        </div>
      ),
    },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    {
      key: "requestType",
      header: "Type",
      render: (r) => REGULARIZATION_REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType,
    },
    {
      key: "current",
      header: "Current",
      render: (r) =>
        r.attendance ? (
          <Badge className={ATTENDANCE_STATUS_COLORS[r.attendance.status] ?? ""}>
            {r.attendance.status.replace("_", " ")}
          </Badge>
        ) : (
          <span className="text-xs text-foreground-muted">No record</span>
        ),
    },
    {
      key: "requested",
      header: "Requested",
      render: (r) => (
        <div className="text-xs text-foreground-secondary">
          {r.requestedStatus && (
            <Badge className={ATTENDANCE_STATUS_COLORS[r.requestedStatus]}>
              {r.requestedStatus.replace("_", " ")}
            </Badge>
          )}
          {r.requestedCheckIn && <div>In: {formatTime(r.requestedCheckIn)}</div>}
          {r.requestedCheckOut && <div>Out: {formatTime(r.requestedCheckOut)}</div>}
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="max-w-[220px] truncate block">{r.reason}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge className={REGULARIZATION_STATUS_COLORS[r.status]}>
          {REGULARIZATION_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          <button
            onClick={() => setDetailTarget(r)}
            className="rounded p-1 text-foreground-secondary hover:bg-panel"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {canReview(r.status) && canAction("hrms", "attendance_regularization", "approve") && (
            <button
              onClick={() => {
                setApproveTarget(r);
                setApproveNote("");
              }}
              className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
              title="Approve"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          {canReview(r.status) && canAction("hrms", "attendance_regularization", "reject") && (
            <button
              onClick={() => {
                setRejectTarget(r);
                setRejectNote("");
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
    <div className="space-y-6">
      <PageHeader
        title="Attendance Corrections"
        subtitle="Review and action employee attendance correction requests"
        actions={null}
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 py-0 w-auto"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select
          value={requestType}
          onChange={(e) => {
            setRequestType(e.target.value);
            setPage(1);
          }}
          className="h-10 py-0 w-auto"
        >
          <option value="">All Types</option>
          {REQUEST_TYPE_OPTIONS.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <DataTable<AttendanceRegularization>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination
          page={data.page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}

      {/* Approve Modal */}
      <Modal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Approve Attendance Correction"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => approveTarget && handleApprove(approveTarget.id)}
              loading={review.isPending}
            >
              Approve
            </Button>
          </>
        }
      >
        {approveTarget && (
          <div className="space-y-3 text-sm">
            <p>
              Approving this request will <strong>update the attendance record</strong> for{" "}
              <strong>{approveTarget.user?.fullName ?? "this employee"}</strong> on{" "}
              <strong>{formatDate(approveTarget.date)}</strong> with the requested values.
            </p>
            <div className="rounded-lg bg-panel p-3 text-xs">
              <div>Type: {REGULARIZATION_REQUEST_TYPE_LABELS[approveTarget.requestType]}</div>
              {approveTarget.requestedStatus && (
                <div>New status: {approveTarget.requestedStatus.replace("_", " ")}</div>
              )}
              {approveTarget.requestedCheckIn && <div>New check-in: {formatTime(approveTarget.requestedCheckIn)}</div>}
              {approveTarget.requestedCheckOut && <div>New check-out: {formatTime(approveTarget.requestedCheckOut)}</div>}
            </div>
            <Field label="Approval Note" hint="Optional — shown to the employee">
              <Textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={2}
                placeholder="Optional note for the employee…"
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Attendance Correction"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={review.isPending}>
              Reject
            </Button>
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

      {/* Detail Modal */}
      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Correction Request Details"
        size="md"
        footer={<Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>}
      >
        {detailTarget && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-foreground-muted">Employee</p>
                <p className="font-medium">{detailTarget.user?.fullName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Date</p>
                <p className="font-medium">{formatDate(detailTarget.date)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Type</p>
                <p className="font-medium">
                  {REGULARIZATION_REQUEST_TYPE_LABELS[detailTarget.requestType] ?? detailTarget.requestType}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Status</p>
                <p className="font-medium">
                  <Badge className={REGULARIZATION_STATUS_COLORS[detailTarget.status]}>
                    {REGULARIZATION_STATUS_LABELS[detailTarget.status]}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Current Status</p>
                <p className="font-medium">
                  {detailTarget.attendance ? (
                    <Badge className={ATTENDANCE_STATUS_COLORS[detailTarget.attendance.status] ?? ""}>
                      {detailTarget.attendance.status.replace("_", " ")}
                    </Badge>
                  ) : (
                    "No record"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Requested Status</p>
                <p className="font-medium">
                  {detailTarget.requestedStatus ? (
                    <Badge className={ATTENDANCE_STATUS_COLORS[detailTarget.requestedStatus]}>
                      {detailTarget.requestedStatus.replace("_", " ")}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Requested Check-In</p>
                <p className="font-medium">{formatTime(detailTarget.requestedCheckIn)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Requested Check-Out</p>
                <p className="font-medium">{formatTime(detailTarget.requestedCheckOut)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Reason</p>
              <p className="rounded-lg bg-panel p-3">{detailTarget.reason}</p>
            </div>
            {detailTarget.reviewNote && (
              <div>
                <p className="text-xs text-foreground-muted">Reviewer Note</p>
                <p className="rounded-lg bg-panel p-3">{detailTarget.reviewNote}</p>
              </div>
            )}
            {detailTarget.reviewer && (
              <p className="text-xs text-foreground-muted">
                Reviewed by {detailTarget.reviewer.fullName}
                {detailTarget.reviewedAt && ` on ${formatDate(detailTarget.reviewedAt)}`}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
