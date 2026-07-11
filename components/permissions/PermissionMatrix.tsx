"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { permissionsService } from "@/services/permissions/permissions.service";
import { getErrorMessage } from "@/services/api/client";
import { PermissionMatrixInput } from "./PermissionMatrixInput";
import type { GrantEntry } from "@/types";

interface PermissionMatrixProps {
  userId: string;
  isMasterUser: boolean;
}

export function PermissionMatrix({ userId, isMasterUser }: PermissionMatrixProps) {
  const [grants, setGrants] = useState<GrantEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const handleChange = useCallback((newGrants: GrantEntry[]) => {
    setGrants(newGrants);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionsService.saveUserGrants(userId, grants);
      toast.success("Permissions saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setSaving(true);
      await permissionsService.revokeAllGrants(userId);
      setShowRevokeModal(false);
      toast.success("All permissions revoked");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (isMasterUser) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-violet-500" />
        <span className="text-sm font-medium text-violet-700">
          Master — Full Access (no permission matrix needed)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PermissionMatrixInput userId={userId} onChange={handleChange} />

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowRevokeModal(true)}
          disabled={saving}
          className="text-rose-600 border-rose-200 hover:bg-rose-50"
        >
          Revoke All Permissions
        </Button>
        <Button type="button" onClick={handleSave} loading={saving}>
          Save Permissions
        </Button>
      </div>

      <ConfirmModal
        open={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={handleRevoke}
        title="Revoke all permissions?"
        message="This will remove all permissions for this user. They will have zero access until new permissions are granted."
        confirmLabel="Revoke All"
        danger
        loading={saving}
      />
    </div>
  );
}
