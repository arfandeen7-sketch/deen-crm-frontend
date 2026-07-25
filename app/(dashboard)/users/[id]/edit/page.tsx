"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { UserForm, type UserFormSubmitValues } from "@/components/forms/UserForm";
import { useUser, useUserMutations } from "@/hooks/useUsers";
import { updateUserSchema } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";
import { permissionsService } from "@/services/permissions/permissions.service";
import { AccessGuard } from "@/components/shared/Guards";
import { useAuthStore } from "@/store/auth.store";
import { usePermissions } from "@/contexts/PermissionContext";
import type { GrantEntry } from "@/types";

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading, isError, refetch } = useUser(params.id);
  const { update } = useUserMutations();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { refetch: refetchPermissions } = usePermissions();
  const [grantFailure, setGrantFailure] = useState<GrantEntry[] | null>(null);

  async function onSubmit(values: UserFormSubmitValues) {
    try {
      const parsed = updateUserSchema.parse(values);
      await update.mutateAsync({ id: params.id, body: parsed });
      try {
        await permissionsService.saveUserGrants(params.id, values.grants);
      } catch (grantError) {
        setGrantFailure(values.grants);
        toast.warning("User updated, but permission grants failed to save.");
        return;
      }
      if (params.id === currentUserId) {
        await refetchPermissions();
      }
      toast.success("User updated");
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function retrySaveGrants() {
    if (!grantFailure) return;
    try {
      await permissionsService.saveUserGrants(params.id, grantFailure);
      toast.success("Permissions saved successfully");
      setGrantFailure(null);
      if (params.id === currentUserId) {
        await refetchPermissions();
      }
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AccessGuard module="users" page="all_users" action="edit">
      <div className="space-y-5">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
        <PageHeader title="Edit User" subtitle={user?.fullName} />

        {grantFailure && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">User updated, but grants failed to save</p>
              <p className="text-sm text-amber-700 mt-1">
                The user profile was updated successfully, but saving the permission grants failed.
                You can retry saving the intended permissions.
              </p>
              <Button type="button" size="sm" className="mt-3" onClick={retrySaveGrants}>
                Retry Save Permissions
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardBody>
            {isLoading ? (
              <LoadingState />
            ) : isError || !user ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <UserForm
                initial={user}
                submitting={update.isPending}
                onSubmit={onSubmit}
                onCancel={() => router.push("/users")}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </AccessGuard>
  );
}
