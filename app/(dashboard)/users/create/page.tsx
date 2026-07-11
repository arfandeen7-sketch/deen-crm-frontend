"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { UserForm, type UserFormSubmitValues } from "@/components/forms/UserForm";
import { useUserMutations } from "@/hooks/useUsers";
import { createUserSchema } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";
import { permissionsService } from "@/services/permissions/permissions.service";
import { AccessGuard } from "@/components/shared/Guards";

export default function CreateUserPage() {
  const router = useRouter();
  const { create } = useUserMutations();

  async function onSubmit(values: UserFormSubmitValues) {
    try {
      const parsed = createUserSchema.parse(values);
      const newUser = await create.mutateAsync(parsed);
      if (values.grants.length > 0) {
        await permissionsService.saveUserGrants(newUser.id, values.grants);
      }
      toast.success("User created");
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
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
