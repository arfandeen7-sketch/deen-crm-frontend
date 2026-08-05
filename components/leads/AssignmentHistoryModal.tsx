"use client";

import { Modal } from "@/components/ui/Modal";
import { useAssignmentHistory } from "@/hooks/useLeadActivity";
import { formatDateTime } from "@/lib/utils";
import type { AssignmentHistoryEntry } from "@/types";

interface AssignmentHistoryModalProps {
  leadId: string | null;
  leadName?: string;
  open: boolean;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  manual: "Manual",
  bulk: "Bulk Assign",
  created: "Created with assignee",
  imported: "Imported with assignee",
};

export function AssignmentHistoryModal({
  leadId,
  leadName,
  open,
  onClose,
}: AssignmentHistoryModalProps) {
  // Lazy fetch — only fires when the modal is open.
  const { data, isLoading, isError } = useAssignmentHistory(leadId, open);

  const history = data?.history ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assignment History"
      description={leadName ? `Complete assignment chain for "${leadName}"` : undefined}
      size="md"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-rose-600">
          Failed to load assignment history. Please try again.
        </p>
      ) : history.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500">This lead has never been assigned.</p>
        </div>
      ) : (
        <ol className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
          {history.map((entry: AssignmentHistoryEntry, idx: number) => {
            const isLatest = idx === 0;
            const isUnassign = entry.action === "unassigned";
            const assigner = entry.assignedBy?.name ?? "Unknown";
            const assignee = entry.assignedTo?.name ?? "Unknown";
            return (
              <li key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                {/* Dot */}
                <div
                  className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    isLatest
                      ? isUnassign
                        ? "border-rose-500 bg-rose-500"
                        : "border-blue-500 bg-blue-500"
                      : isUnassign
                        ? "border-rose-300 bg-white"
                        : "border-slate-300 bg-white"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-800">
                      {isUnassign ? (
                        <>
                          {assigner} <span className="text-rose-400">unassigned</span> {assignee}
                        </>
                      ) : (
                        <>
                          {assigner} <span className="text-slate-400">→</span> {assignee}
                        </>
                      )}
                    </p>
                    {isLatest && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isUnassign
                            ? "bg-rose-50 text-rose-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateTime(entry.assignedAt)}
                  </p>
                  {entry.type !== "manual" && (
                    <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {typeLabels[entry.type] ?? entry.type}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}
