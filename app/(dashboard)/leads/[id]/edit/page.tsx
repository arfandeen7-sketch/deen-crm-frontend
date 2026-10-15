"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { LeadForm } from "@/components/forms/LeadForm";
import { AccessGuard } from "@/components/shared/Guards";
import { useLead, useLeadMutations } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { canMutateDealClosedLead } from "@/lib/dealClosedLock";
import { Button } from "@/components/ui/Button";
import { useClientByLeadId, useClientMutations } from "@/hooks/useClients";
import { useTenantByLeadId, useTenantMutations } from "@/hooks/useTenants";
import { getErrorMessage } from "@/services/api/client";
import { leadWithClientSchema, splitLeadClientValues, type LeadWithClientFormValues } from "@/schemas/lead.schema";

export default function EditLeadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const { data: lead, isLoading, isError, refetch } = useLead(params.id);
  const { data: client } = useClientByLeadId(params.id);
  const { data: tenant } = useTenantByLeadId(params.id);
  const { update } = useLeadMutations();
  const { upsert: upsertClient } = useClientMutations(params.id);
  const { upsert: upsertTenant } = useTenantMutations(params.id);

  async function onSubmit(values: LeadWithClientFormValues) {
    try {
      const parsed = leadWithClientSchema.parse(values);
      const { leadValues, clientValues, tenantValues } = splitLeadClientValues(parsed);
      const leadPayload = {
        ...leadValues,
        // Always send an explicit clear signal when "No broker" is selected.
        brokerId: leadValues.brokerId ?? null,
      };

      // Save lead first, then the appropriate detail record (Buyer or Tenant)
      await update.mutateAsync({ id: params.id, body: leadPayload });

      // Save Buyer (client) details when service type is NOT Rent
      const hasClientData = Object.values(clientValues).some((v) => v !== undefined && v !== "");
      if (hasClientData && leadPayload.serviceType?.toLowerCase() !== "rent") {
        await upsertClient.mutateAsync(clientValues);
      }

      // Save Tenant details when service type IS Rent
      const hasTenantData = Object.values(tenantValues).some((v) => v !== undefined && v !== "");
      if (hasTenantData && leadPayload.serviceType?.toLowerCase() === "rent") {
        await upsertTenant.mutateAsync(tenantValues);
      }

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
          ) : !canMutateDealClosedLead(role, lead.leadStatus) ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <Lock className="h-4 w-4" />
                This deal is closed and locked.
              </div>
              <p className="max-w-lg text-sm text-slate-600">
                Only a Master user can edit this lead or change its status. Master can unlock it by choosing a different status, which returns the lead to All Leads.
              </p>
              <Button variant="outline" onClick={() => router.push(`/leads/${params.id}`)}>
                Back to lead
              </Button>
            </div>
          ) : (
            <LeadForm
              initial={lead}
              initialClient={client}
              initialTenant={tenant}
              submitting={update.isPending || upsertClient.isPending || upsertTenant.isPending}
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
