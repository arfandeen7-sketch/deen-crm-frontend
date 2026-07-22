"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RejectionNoteModal } from "./RejectionNoteModal";

export function ReviewActions({
  onApprove,
  onReject,
  loading,
}: {
  onApprove: () => void;
  onReject: (note: string) => void;
  loading?: boolean;
}) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  if (confirmApprove) {
    return (
      <div className="flex gap-2">
        <Button onClick={() => onApprove()} loading={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          Confirm Approval
        </Button>
        <Button variant="secondary" onClick={() => setConfirmApprove(false)}>Cancel</Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmApprove(true)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <CheckCircle className="h-4 w-4" /> Approve
        </button>
        <button
          onClick={() => setShowReject(true)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
        >
          <XCircle className="h-4 w-4" /> Reject
        </button>
      </div>

      <RejectionNoteModal
        open={showReject}
        onConfirm={(note) => { setShowReject(false); onReject(note); }}
        onCancel={() => setShowReject(false)}
        loading={loading}
      />
    </>
  );
}
