"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea, Field } from "@/components/ui/Input";
import { toast } from "sonner";
import { useCancelLeave } from "@/hooks/useHrms";
import { getErrorMessage } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

interface LeaveCancelDialogProps {
  open: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
}

export function LeaveCancelDialog({ open, onClose, request }: LeaveCancelDialogProps) {
  const [reason, setReason] = useState("");
  const cancel = useCancelLeave();

  const handleConfirm = () => {
    if (!request) return;
    cancel.mutate(
      { id: request.id, cancellationReason: reason || undefined },
      {
        onSuccess: () => {
          toast.success("Leave request cancelled");
          setReason("");
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
      title="Cancel Leave Request?"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={cancel.isPending}>
            Keep It
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={cancel.isPending}>
            Yes, Cancel Request
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-foreground-secondary">
        This will withdraw your pending leave request. This action cannot be undone.
      </p>
      <Field label="Cancellation Reason (optional)">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you cancelling this request?"
          rows={3}
        />
      </Field>
    </Modal>
  );
}
