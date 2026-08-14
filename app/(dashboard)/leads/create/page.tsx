"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LeadForm } from "@/components/forms/LeadForm";
import { AccessGuard } from "@/components/shared/Guards";
import { useLeadMutations } from "@/hooks/useLeads";
import { getErrorMessage } from "@/services/api/client";
import { leadWithClientSchema, splitLeadClientValues, type LeadWithClientFormValues } from "@/schemas/lead.schema";
import { clientsService } from "@/services/clients/clients.service";
import { tenantsService } from "@/services/tenants/tenants.service";

export default function CreateLeadPage() {
  const router = useRouter();
  const { create } = useLeadMutations();

  async function onSubmit(values: LeadWithClientFormValues) {
    try {
      const parsed = leadWithClientSchema.parse(values);
      const { leadValues, clientValues, tenantValues } = splitLeadClientValues(parsed);

      // 1. Save the lead
      const lead = await create.mutateAsync(leadValues);

      // 2. Save Buyer (client) or Tenant details depending on service type
      const isRent = leadValues.serviceType?.toLowerCase() === "rent";

      if (isRent) {
        const hasTenantData = Object.values(tenantValues).some(Boolean);
        if (hasTenantData) {
          await tenantsService.upsert(lead.id, tenantValues).catch(() => {
            toast.warning("Lead created, but tenant details could not be saved. You can add them from the lead page.");
          });
        }
      } else {
        const hasClientData = Object.values(clientValues).some(Boolean);
        if (hasClientData) {
          await clientsService.upsert(lead.id, clientValues).catch(() => {
            toast.warning("Lead created, but buyer details could not be saved. You can add them from the lead page.");
          });
        }
      }

      toast.success("Lead created");
      router.push(`/leads/${lead.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AccessGuard module="leads" page="all_leads" action="create">
    <div className="space-y-5">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>
      <PageHeader title="Create Lead" subtitle="Add a new lead to the CRM" />
      <Card>
        <CardBody>
          <LeadForm
            submitting={create.isPending}
            onSubmit={onSubmit}
            onCancel={() => router.push("/leads")}
          />
        </CardBody>
      </Card>
    </div>
    </AccessGuard>
  );
}
