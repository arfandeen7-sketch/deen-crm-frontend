"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { LeadForm } from "@/components/forms/LeadForm";
import { useLead, useLeadMutations } from "@/hooks/useLeads";
import { getErrorMessage } from "@/services/api/client";
import { leadSchema, type LeadFormValues } from "@/schemas/lead.schema";

export default function EditLeadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading, isError, refetch } = useLead(params.id);
  const { update } = useLeadMutations();

  async function onSubmit(values: LeadFormValues) {
    try {
      const parsed = leadSchema.parse(values);
      await update.mutateAsync({ id: params.id, body: parsed });
      toast.success("Lead updated");
      router.push(`/leads/${params.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <div className="space-y-5">
      <Link href={`/leads/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to lead
      </Link>
      <PageHeader title="Edit Lead" subtitle={lead?.leadName} />
      <Card>
        <CardBody>
          {isLoading ? (
            <LoadingState />
          ) : isError || !lead ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <LeadForm
              initial={lead}
              submitting={update.isPending}
              onSubmit={onSubmit}
              onCancel={() => router.push(`/leads/${params.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
