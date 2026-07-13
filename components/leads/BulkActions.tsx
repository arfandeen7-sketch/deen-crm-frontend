"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserCheck, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Select } from "@/components/ui/Input";
import { useLeadMutations } from "@/hooks/useLeads";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";

export function BulkActions({
  selectedIds,
  onClear,
}: {
  selectedIds: string[];
  onClear: () => void;
}) {
  const { bulkAssign, bulkStatus } = useLeadMutations();
  const { users } = useAssignableUsers();
  const statuses = useFieldOptions("lead_status");
  const { canAction } = useAuth();
  const canAssign = canAction("leads", "all_leads", "bulk_assign");
  const canBulkStatus = canAction("leads", "all_leads", "bulk_status");
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [status, setStatus] = useState("");

  if (selectedIds.length === 0) return null;
  if (!canAssign && !canBulkStatus) return null;

  async function doAssign() {
    if (!assignTo) return toast.error("Select a user");
    try {
      const res = await bulkAssign.mutateAsync({ ids: selectedIds, assignedTo: assignTo });
      toast.success(`Assigned ${res.updated} lead(s)`);
      setAssignOpen(false);
      onClear();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function doStatus() {
    if (!status) return toast.error("Select a status");
    try {
      const res = await bulkStatus.mutateAsync({ ids: selectedIds, leadStatus: status });
      toast.success(`Updated ${res.updated} lead(s)`);
      setStatusOpen(false);
      onClear();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl bg-zinc-900 px-5 py-3 shadow-lg shadow-black/20">
        <span className="text-sm font-medium text-white">
          {selectedIds.length} selected
        </span>
        <div className="h-4 w-px bg-zinc-700" />
        <div className="flex items-center gap-2">
          {canAssign && (
            <button
              onClick={() => setAssignOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <UserCheck className="h-4 w-4" /> Assign
            </button>
          )}
          {canBulkStatus && (
            <button
              onClick={() => setStatusOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <Tag className="h-4 w-4" /> Update Status
            </button>
          )}
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {canAssign && (
        <Modal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          title="Bulk Assign Leads"
          description={`Assign ${selectedIds.length} lead(s) to a user`}
          footer={
            <>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={doAssign} loading={bulkAssign.isPending}>Assign</Button>
            </>
          }
        >
          <Field label="Assign to">
            <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </Select>
          </Field>
        </Modal>
      )}

      {canBulkStatus && (
        <Modal
          open={statusOpen}
          onClose={() => setStatusOpen(false)}
          title="Bulk Update Status"
          description={`Update status for ${selectedIds.length} lead(s)`}
          footer={
            <>
              <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
              <Button onClick={doStatus} loading={bulkStatus.isPending}>Update</Button>
            </>
          }
        >
          <Field label="New status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Select status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </Modal>
      )}
    </>
  );
}
