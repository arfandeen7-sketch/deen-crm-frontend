"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban } from "lucide-react";
import { useLeaveRequest, useLeaveAudits, useCancelLeave } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveRequestStatusBadge } from "@/components/leave/LeaveRequestStatusBadge";
import { LeaveCancelDialog } from "@/components/leave/LeaveCancelDialog";
import { LeaveAuditTrail } from "@/components/leave/LeaveAuditTrail";
import { LeaveAttachmentViewer } from "@/components/leave/LeaveAttachmentViewer";
import { formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

export default function LeaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: request, isLoading } = useLeaveRequest(id);
  const { data: audits } = useLeaveAudits(id);
  const [showCancel, setShowCancel] = useState(false);
  const cancel = useCancelLeave();

  const handleCancel = (cancellationReason?: string) => {
    cancel.mutate(
      { id, cancellationReason },
      {
        onSuccess: () => {
          toast.success("Leave request cancelled");
          setShowCancel(false);
          router.push("/my-hr/leave");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  if (isLoading) {
    return (
      <AccessGuard module="my_hr" page="my_leave">
        <p className="py-8 text-center text-sm text-foreground-muted">Loading…</p>
      </AccessGuard>
    );
  }

  if (!request) {
    return (
      <AccessGuard module="my_hr" page="my_leave">
        <p className="py-8 text-center text-sm text-foreground-muted">Leave request not found.</p>
      </AccessGuard>
    );
  }

  return (
    <AccessGuard module="my_hr" page="my_leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Request Detail"
          subtitle={`${request.leaveType?.name || request.leaveTypeCode} · ${formatDate(request.dateFrom)} — ${formatDate(request.dateTo)}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {request.status === "pending" && (
                <Button variant="danger" onClick={() => setShowCancel(true)}>
                  <Ban className="h-4 w-4" /> Cancel Request
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
                {request.cancelledAt && (
                  <InfoRow label="Cancelled On" value={formatDateTime(request.cancelledAt)} />
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
              {request.cancellationReason && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Cancellation Reason</p>
                  <p className="mt-1 text-sm text-foreground">{request.cancellationReason}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attachment */}
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

            {/* Audit Trail */}
            <Card>
              <CardHeader title="Audit Trail" />
              <CardBody>
                <LeaveAuditTrail audits={audits ?? []} />
              </CardBody>
            </Card>
          </div>
        </div>

        <LeaveCancelDialog
          open={showCancel}
          onClose={() => setShowCancel(false)}
          request={request}
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
