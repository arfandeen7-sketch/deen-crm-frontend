"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AddPropertyForm } from "@/components/properties/AddPropertyForm";
import { usePropertySubmissionMutations } from "@/hooks/usePropertySubmissions";
import { getErrorMessage } from "@/services/api/client";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { create } = usePropertySubmissionMutations();

  async function onSubmit(payload: Record<string, unknown>) {
    try {
      const submission = await create.mutateAsync(payload);
      toast.success("Property submitted for approval. The master will be notified to review it.");
      router.push(`/properties/submissions/${submission.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <div>
      <Link
        href="/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
      </Link>

      <PageHeader
        title="Add Property to Property Finder"
        subtitle="Submit a new property for master approval before publishing to Property Finder"
      />

      <div className="mt-6">
        <AddPropertyForm submitting={create.isPending} onSubmit={onSubmit} onCancel={() => router.push("/properties")} />
      </div>
    </div>
  );
}
