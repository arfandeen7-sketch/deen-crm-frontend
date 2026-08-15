"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { OwnerForm } from "@/components/forms/OwnerForm";
import { AccessGuard } from "@/components/shared/Guards";
import { useOwner, useOwnerMutations } from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";
import type { OwnerFormValues } from "@/schemas/owner.schema";

export default function EditOwnerPage() {
  return (
    <AccessGuard module="owners" page="all_owners" action="edit">
      <EditOwnerContent />
    </AccessGuard>
  );
}

function EditOwnerContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: owner, isLoading } = useOwner(params.id);
  const { update } = useOwnerMutations();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: OwnerFormValues) {
    if (!params.id) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ id: params.id, body: values });
      toast.success("Owner updated successfully");
      router.push(`/owners/${params.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-400">Loading owner…</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-400">Owner not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit Owner"
        subtitle={owner.fullName}
        actions={
          <Link
            href={`/owners/${owner.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Owner
          </Link>
        }
      />

      <Card>
        <CardBody>
          <OwnerForm
            initial={owner}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/owners/${owner.id}`)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
