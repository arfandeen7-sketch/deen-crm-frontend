"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserForm, type UserFormSubmitValues } from "@/components/forms/UserForm";
import { useUserMutations } from "@/hooks/useUsers";
import { createUserSchema } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";
import { permissionsService } from "@/services/permissions/permissions.service";
import { AccessGuard } from "@/components/shared/Guards";

export default function CreateUserPage() {
  const router = useRouter();
  const { create } = useUserMutations();
  const [partialFailure, setPartialFailure] = useState<{ userId: string; grants: import("@/types").GrantEntry[] } | null>(null);
  const [retrying, setRetrying] = useState(false);

  async function onSubmit(values: UserFormSubmitValues) {
    try {
      const parsed = createUserSchema.parse(values);
      const newUser = await create.mutateAsync(parsed);
      if (values.grants.length > 0) {
        try {
          await permissionsService.saveUserGrants(newUser.id, values.grants);
        } catch (grantError) {
          setPartialFailure({ userId: newUser.id, grants: values.grants });
          toast.warning("User created, but permission grants failed to save.");
          return;
        }
      }
      toast.success("User created");
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function retrySaveGrants() {
    if (!partialFailure) return;
    setRetrying(true);
    try {
      await permissionsService.saveUserGrants(partialFailure.userId, partialFailure.grants);
      toast.success("Permissions saved successfully");
      setPartialFailure(null);
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <AccessGuard module="users" page="all_users" action="create">
      <div className="space-y-5">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
        <PageHeader title="Create User" subtitle="Add a new staff member" />

        {partialFailure && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">User created with no confirmed permissions</p>
              <p className="text-sm text-amber-700 mt-1">
                The user account was created successfully, but saving the permission grants failed.
                You can retry saving the intended permissions now.
              </p>
              <div className="flex gap-2 mt-3">
                <Button type="button" size="sm" onClick={retrySaveGrants} loading={retrying}>
                  Retry Save Permissions
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/users/${partialFailure.userId}/edit`)}
                >
                  Go to Edit User
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardBody>
            <UserForm
              submitting={create.isPending}
              onSubmit={onSubmit}
              onCancel={() => router.push("/users")}
            />
          </CardBody>
        </Card>
      </div>
    </AccessGuard>
  );
}
