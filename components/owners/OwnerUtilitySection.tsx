"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { CanAccess } from "@/components/shared/Guards";
import { getErrorMessage } from "@/services/api/client";
import { formatDate } from "@/lib/utils";
import type { OwnerUtilityAccount } from "@/types";

const UTILITY_TYPES = ["DEWA", "Cooler", "Gas", "Lock No.", "Other"];

interface Props {
  utilities: OwnerUtilityAccount[];
  onCreate: (body: { type: string; value: string; label?: string | null; notes?: string | null }) => Promise<unknown>;
  onUpdate: (utilityId: string, body: Partial<{ type: string; value: string; label?: string | null; notes?: string | null }>) => Promise<unknown>;
  onRemove: (utilityId: string) => Promise<unknown>;
}

export function OwnerUtilitySection({ utilities, onCreate, onUpdate, onRemove }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OwnerUtilityAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      {utilities.length === 0 ? (
        <p className="text-sm text-slate-400">No utility / account details added yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {utilities.map((u) => (
            <UtilityRow
              key={u.id}
              utility={u}
              onEdit={() => setEditTarget(u)}
              onDelete={() => setDeleteId(u.id)}
            />
          ))}
        </div>
      )}

      <CanAccess module="owners" page="all_owners" action="edit">
        <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Utility / Account Detail
        </Button>
      </CanAccess>

      <UtilityFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Utility / Account Detail"
        onSubmit={async (body) => {
          setBusy(true);
          try {
            await onCreate(body);
            toast.success("Utility detail added.");
            setAddOpen(false);
          } catch (err) {
            toast.error(getErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
        loading={busy}
      />

      <UtilityFormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Utility / Account Detail"
        initial={editTarget ?? undefined}
        onSubmit={async (body) => {
          if (!editTarget) return;
          setBusy(true);
          try {
            await onUpdate(editTarget.id, body);
            toast.success("Utility detail updated.");
            setEditTarget(null);
          } catch (err) {
            toast.error(getErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
        loading={busy}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          setBusy(true);
          try {
            await onRemove(deleteId);
            toast.success("Utility detail removed.");
            setDeleteId(null);
          } catch (err) {
            toast.error(getErrorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
        title="Remove utility detail?"
        message="This will permanently delete this utility / account record."
        confirmLabel="Remove"
        loading={busy}
      />
    </div>
  );
}

function UtilityRow({
  utility,
  onEdit,
  onDelete,
}: {
  utility: OwnerUtilityAccount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeLabel = utility.label && utility.label.trim() ? utility.label : utility.type;
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Zap className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {typeLabel}
            </p>
            <p className="mt-0.5 break-words text-sm font-medium text-slate-800">
              {utility.value}
            </p>
            {utility.notes && (
              <p className="mt-1 text-xs text-neutral-500 whitespace-pre-wrap">{utility.notes}</p>
            )}
            <p className="mt-1 text-[11px] text-neutral-400">Added {formatDate(utility.createdAt)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <CanAccess module="owners" page="all_owners" action="edit">
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </CanAccess>
          <CanAccess module="owners" page="all_owners" action="delete">
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </CanAccess>
        </div>
      </div>
    </div>
  );
}

interface FormState {
  type: string;
  label: string;
  value: string;
  notes: string;
}

function UtilityFormModal({
  open,
  onClose,
  title,
  initial,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: OwnerUtilityAccount;
  onSubmit: (body: { type: string; value: string; label?: string | null; notes?: string | null }) => Promise<unknown>;
  loading: boolean;
}) {
  const [state, setState] = useState<FormState>({
    type: initial?.type ?? "DEWA",
    label: initial?.label ?? "",
    value: initial?.value ?? "",
    notes: initial?.notes ?? "",
  });

  // Re-sync when the modal opens (so switching edit targets updates the form)
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setState({
        type: initial?.type ?? "DEWA",
        label: initial?.label ?? "",
        value: initial?.value ?? "",
        notes: initial?.notes ?? "",
      });
    }
  }

  function handleClose() {
    onClose();
  }

  async function handleSubmit() {
    if (!state.value.trim()) {
      toast.error("Value / detail is required.");
      return;
    }
    await onSubmit({
      type: state.type,
      value: state.value.trim(),
      label: state.type === "Other" && state.label.trim() ? state.label.trim() : null,
      notes: state.notes.trim() || null,
    });
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md">
      <div className="space-y-4">
        <Field label="Type">
          <Select
            value={state.type}
            onChange={(e) => setState((s) => ({ ...s, type: e.target.value }))}
          >
            {UTILITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Field>

        {state.type === "Other" && (
          <Field label="Custom Label">
            <Input
              placeholder="e.g. Internet Account"
              value={state.label}
              onChange={(e) => setState((s) => ({ ...s, label: e.target.value }))}
            />
          </Field>
        )}

        <Field label="Account No. / Value" required>
          <Input
            placeholder="e.g. 123456789"
            value={state.value}
            onChange={(e) => setState((s) => ({ ...s, value: e.target.value }))}
          />
        </Field>

        <Field label="Notes">
          <Textarea
            rows={3}
            placeholder="Optional notes"
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} loading={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
