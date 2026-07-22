"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea, Field } from "@/components/ui/Input";
import { toast } from "sonner";
import { useReviewLeave } from "@/hooks/useHrms";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

interface LeaveReviewDialogProps {
  open: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  mode: "approve" | "reject";
}

export function LeaveReviewDialog({ open, onClose, request, mode }: LeaveReviewDialogProps) {
  const [reviewNote, setReviewNote] = useState("");
  const review = useReviewLeave();

  const handleConfirm = () => {
    if (!request) return;
    const status = mode === "approve" ? "approved" : "rejected";
    review.mutate(
      { id: request.id, status, reviewNote: reviewNote || undefined },
      {
        onSuccess: () => {
          toast.success(`Leave ${status}`);
          setReviewNote("");
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  if (!request) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={review.isPending}>
            Cancel
          </Button>
          <Button
            variant={mode === "approve" ? "primary" : "danger"}
            onClick={handleConfirm}
            loading={review.isPending}
          >
            {mode === "approve" ? "Approve" : "Reject"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-panel p-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-foreground-muted">Employee:</span>{" "}
              <span className="font-medium">{request.user?.fullName || "—"}</span>
            </div>
            <div>
              <span className="text-foreground-muted">Type:</span>{" "}
              <span className="font-medium">{request.leaveType?.name || request.leaveTypeCode}</span>
            </div>
            <div>
              <span className="text-foreground-muted">From:</span>{" "}
              <span className="font-medium">{formatDate(request.dateFrom)}</span>
            </div>
            <div>
              <span className="text-foreground-muted">To:</span>{" "}
              <span className="font-medium">{formatDate(request.dateTo)}</span>
            </div>
            <div>
              <span className="text-foreground-muted">Days:</span>{" "}
              <span className="font-medium">{request.totalDays}</span>
            </div>
            {request.reason && (
              <div className="col-span-2">
                <span className="text-foreground-muted">Reason:</span>{" "}
                <span className="font-medium">{request.reason}</span>
              </div>
            )}
          </div>
        </div>
        <Field label="Review Note (optional)">
          <Textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder={mode === "approve" ? "Add approval note..." : "Add rejection reason..."}
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
}
