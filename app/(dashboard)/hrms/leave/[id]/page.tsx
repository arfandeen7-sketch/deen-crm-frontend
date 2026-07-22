"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { useLeaveRequest, useLeaveAudits, useReviewLeave } from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveRequestStatusBadge } from "@/components/leave/LeaveRequestStatusBadge";
import { LeaveReviewDialog } from "@/components/leave/LeaveReviewDialog";
import { LeaveAuditTrail } from "@/components/leave/LeaveAuditTrail";
import { LeaveAttachmentViewer } from "@/components/leave/LeaveAttachmentViewer";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

export default function HrLeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { canAction } = useAuth();
  const { data: request, isLoading } = useLeaveRequest(id);
  const { data: audits } = useLeaveAudits(id);
  const [reviewTarget, setReviewTarget] = useState<LeaveRequest | null>(null);
  const [reviewMode, setReviewMode] = useState<"approve" | "reject">("approve");

  const canApprove = canAction("hrms", "leave", "approve");
  const canReject = canAction("hrms", "leave", "reject");

  const openReview = (mode: "approve" | "reject") => {
    if (request) {
      setReviewTarget(request);
      setReviewMode(mode);
    }
  };

  if (isLoading) {
    return (
      <AccessGuard module="hrms" page="leave">
        <p className="py-8 text-center text-sm text-foreground-muted">Loading…</p>
      </AccessGuard>
    );
  }

  if (!request) {
    return (
      <AccessGuard module="hrms" page="leave">
        <p className="py-8 text-center text-sm text-foreground-muted">Leave request not found.</p>
      </AccessGuard>
    );
  }

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Request Detail"
          subtitle={`${request.user?.fullName || "—"} · ${request.leaveType?.name || request.leaveTypeCode}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {request.status === "pending" && canApprove && (
                <Button variant="primary" onClick={() => openReview("approve")}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
              )}
              {request.status === "pending" && canReject && (
                <Button variant="danger" onClick={() => openReview("reject")}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              )}
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader title="Request Information" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Status" value={<LeaveRequestStatusBadge status={request.status} />} />
                <InfoRow label="Employee" value={request.user?.fullName || "—"} />
                <InfoRow label="Employee ID" value={request.user?.employeeId || "—"} />
                <InfoRow label="Department" value={request.user?.department || "—"} />
                <InfoRow label="Leave Type" value={request.leaveType?.name || request.leaveTypeCode} />
                <InfoRow label="Start Date" value={formatDate(request.dateFrom)} />
                <InfoRow label="End Date" value={formatDate(request.dateTo)} />
                <InfoRow label="Total Days" value={request.totalDays} />
                <InfoRow label="Half Day" value={request.isHalfDay ? `Yes (${request.halfDayPeriod?.replace("_", " ")})` : "No"} />
                <InfoRow label="Applied On" value={formatDateTime(request.createdAt)} />
                {request.reviewedAt && (
                  <InfoRow label="Reviewed On" value={formatDateTime(request.reviewedAt)} />
                )}
                {request.reviewer && (
                  <InfoRow label="Reviewed By" value={request.reviewer.fullName} />
                )}
              </div>
              {request.reason && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Reason</p>
                  <p className="mt-1 text-sm text-foreground">{request.reason}</p>
                </div>
              )}
              {request.reviewNote && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Review Note</p>
                  <p className="mt-1 text-sm text-foreground">{request.reviewNote}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {request.attachmentUrl && (
              <Card>
                <CardHeader title="Attachment" />
                <CardBody>
                  <LeaveAttachmentViewer
                    attachmentUrl={request.attachmentUrl}
                    attachmentSignedUrl={request.attachmentSignedUrl}
                  />
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader title="Audit Trail" />
              <CardBody>
                <LeaveAuditTrail audits={audits ?? []} />
              </CardBody>
            </Card>
          </div>
        </div>

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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
