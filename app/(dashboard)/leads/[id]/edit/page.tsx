"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { LeadForm } from "@/components/forms/LeadForm";
import { AccessGuard } from "@/components/shared/Guards";
import { useLead, useLeadMutations } from "@/hooks/useLeads";
import { useClientByLeadId, useClientMutations } from "@/hooks/useClients";
import { getErrorMessage } from "@/services/api/client";
import { leadWithClientSchema, splitLeadClientValues, type LeadWithClientFormValues } from "@/schemas/lead.schema";

export default function EditLeadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading, isError, refetch } = useLead(params.id);
  const { data: client } = useClientByLeadId(params.id);
  const { update } = useLeadMutations();
  const { upsert: upsertClient } = useClientMutations(params.id);

  async function onSubmit(values: LeadWithClientFormValues) {
    try {
      const parsed = leadWithClientSchema.parse(values);
      const { leadValues, clientValues } = splitLeadClientValues(parsed);

      // Save lead and client in parallel when both have data
      const leadPromise = update.mutateAsync({ id: params.id, body: leadValues });
      const hasClientData = Object.values(clientValues).some((v) => v !== undefined && v !== "");
      const clientPromise = hasClientData
        ? upsertClient.mutateAsync(clientValues)
        : Promise.resolve();

      await Promise.all([leadPromise, clientPromise]);

      toast.success("Lead updated");
      router.push(`/leads/${params.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AccessGuard module="leads" page="all_leads" action="edit">
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
              initialClient={client}
              submitting={update.isPending || upsertClient.isPending}
              onSubmit={onSubmit}
              onCancel={() => router.push(`/leads/${params.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
    </AccessGuard>
  );
}
