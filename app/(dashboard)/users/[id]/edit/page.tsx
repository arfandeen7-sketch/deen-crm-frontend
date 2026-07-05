"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { UserForm } from "@/components/forms/UserForm";
import { useUser, useUserMutations } from "@/hooks/useUsers";
import { updateUserSchema, type CreateUserValues, type UpdateUserValues } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";
import { permissionsService } from "@/services/permissions/permissions.service";
import { PermissionGuard } from "@/components/shared/Guards";
import type { ModuleName, PermissionAction } from "@/types";

type SubmitValues = CreateUserValues & Pick<UpdateUserValues, "moduleAccess" | "moduleAccessOverridden"> & {
  permissions?: Record<ModuleName, PermissionAction[]>;
};

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading, isError, refetch } = useUser(params.id);
  const { update } = useUserMutations();

  async function onSubmit(values: SubmitValues) {
    try {
      const { permissions: _permissions, ...parsed } = updateUserSchema.parse(values);
      await update.mutateAsync({ id: params.id, body: parsed });
      if (values.permissions) {
        await permissionsService.updateUserPermissions(params.id, values.permissions);
      }
      toast.success("User updated");
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <PermissionGuard permission="users.manage">
    <div className="space-y-5">
      <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>
      <PageHeader title="Edit User" subtitle={user?.fullName} />
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
    </PermissionGuard>
  );
}
