"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ROLE_LABELS } from "@/constants";
import { useOwnerCreatedByUsers, useOwnerMutations } from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";

export function EditCreatedByModal({
  owner,
  open,
  onClose,
}: {
  owner: { id: string; fullName: string; createdById: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: users, isLoading, isError } = useOwnerCreatedByUsers(open);
  const { updateCreatedBy } = useOwnerMutations();
  const [createdById, setCreatedById] = useState("");

  useEffect(() => {
    if (owner) setCreatedById(owner.createdById);
  }, [owner]);

  async function handleSave() {
    if (!owner || !createdById || createdById === owner.createdById) return;
    try {
      await updateCreatedBy.mutateAsync({ id: owner.id, createdById });
      toast.success("Created By updated");
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <Modal
      open={open && !!owner}
      onClose={onClose}
      title="Edit Created By"
      description={owner ? `Choose who created ${owner.fullName}.` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={updateCreatedBy.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={updateCreatedBy.isPending}
            disabled={!createdById || createdById === owner?.createdById || isLoading}
          >
            Save
          </Button>
        </>
      }
    >
      <Field label="Created By" required hint="Includes every CRM user, including Master accounts.">
        <Select
          value={createdById}
          onChange={(e) => setCreatedById(e.target.value)}
          disabled={isLoading || isError}
        >
          <option value="" disabled>
            {isLoading ? "Loading users…" : "Select a user"}
          </option>
          {(users ?? []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} · {ROLE_LABELS[user.role] ?? user.role}
              {user.isActive ? "" : " (inactive)"}
            </option>
          ))}
        </Select>
      </Field>
      {isError && (
        <p className="mt-2 text-xs font-medium text-red-600">Could not load the user list.</p>
      )}
    </Modal>
  );
}
