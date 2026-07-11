"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { UserForm, type UserFormSubmitValues } from "@/components/forms/UserForm";
import { useUser, useUserMutations } from "@/hooks/useUsers";
import { updateUserSchema } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";
import { permissionsService } from "@/services/permissions/permissions.service";
import { AccessGuard } from "@/components/shared/Guards";
import { useAuthStore } from "@/store/auth.store";
import { usePermissions } from "@/contexts/PermissionContext";

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading, isError, refetch } = useUser(params.id);
  const { update } = useUserMutations();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { refetch: refetchPermissions } = usePermissions();

  async function onSubmit(values: UserFormSubmitValues) {
    try {
      const parsed = updateUserSchema.parse(values);
      await update.mutateAsync({ id: params.id, body: parsed });
      await permissionsService.saveUserGrants(params.id, values.grants);
      // If the edited user is the currently logged-in user, refresh own access map
      if (params.id === currentUserId) {
        await refetchPermissions();
      }
      toast.success("User updated");
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AccessGuard module="users" page="all_users">
      <div className="space-y-5">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
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
    </AccessGuard>
  );
}
