"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { UserForm } from "@/components/forms/UserForm";
import { useUserMutations } from "@/hooks/useUsers";
import { createUserSchema, type CreateUserValues, type UpdateUserValues } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";
import { PermissionGuard } from "@/components/shared/Guards";

export default function CreateUserPage() {
  const router = useRouter();
  const { create } = useUserMutations();

  type SubmitValues = CreateUserValues & Pick<UpdateUserValues, "moduleAccess" | "moduleAccessOverridden">;

  async function onSubmit(values: SubmitValues) {
    try {
      const { moduleAccess, moduleAccessOverridden, ...rest } = values;
      const parsed = createUserSchema.parse(rest);
      await create.mutateAsync({
        ...parsed,
        ...(moduleAccessOverridden && { moduleAccess, moduleAccessOverridden }),
      });
      toast.success("User created");
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
      <PageHeader title="Create User" subtitle="Add a new staff member" />
      <Card>
        <CardBody>
          <UserForm submitting={create.isPending} onSubmit={onSubmit} onCancel={() => router.push("/users")} />
        </CardBody>
      </Card>
    </div>
    </PermissionGuard>
  );
}
