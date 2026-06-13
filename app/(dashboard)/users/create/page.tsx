"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { UserForm } from "@/components/forms/UserForm";
import { useUserMutations } from "@/hooks/useUsers";
import { createUserSchema, type CreateUserValues } from "@/schemas/user.schema";
import { getErrorMessage } from "@/services/api/client";

export default function CreateUserPage() {
  const router = useRouter();
  const { create } = useUserMutations();

  async function onSubmit(values: CreateUserValues) {
    try {
      const parsed = createUserSchema.parse(values);
      await create.mutateAsync(parsed);
      toast.success("User created");
      router.push("/users");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
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
  );
}
