"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, UserCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { OwnerForm } from "@/components/forms/OwnerForm";
import { AccessGuard } from "@/components/shared/Guards";
import { useOwnerMutations } from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";
import type { OwnerFormValues } from "@/schemas/owner.schema";

export default function CreateOwnerPage() {
  return (
    <AccessGuard module="owners" page="all_owners" action="create">
      <CreateOwnerContent />
    </AccessGuard>
  );
}

function CreateOwnerContent() {
  const router = useRouter();
  const { create } = useOwnerMutations();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: OwnerFormValues) {
    setSubmitting(true);
    try {
      const result = await create.mutateAsync(values);
      if (result.duplicate) {
        toast.success("Owner already exists — opened existing profile", {
          description: `${result.owner.fullName} (${result.owner.mobileNumber})`,
        });
      } else {
        toast.success("Owner created successfully");
      }
      router.push(`/owners/${result.owner.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add Owner"
        subtitle="Create a new property owner — no duplicates allowed"
        actions={
          <Link
            href="/owners"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Owners
          </Link>
        }
      />

      <Card>
        <CardBody>
          <OwnerForm
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/owners")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
