"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LeadForm } from "@/components/forms/LeadForm";
import { useLeadMutations } from "@/hooks/useLeads";
import { getErrorMessage } from "@/services/api/client";
import type { LeadFormValues } from "@/schemas/lead.schema";
import { leadSchema } from "@/schemas/lead.schema";

export default function CreateLeadPage() {
  const router = useRouter();
  const { create } = useLeadMutations();

  async function onSubmit(values: LeadFormValues) {
    try {
      const parsed = leadSchema.parse(values);
      const lead = await create.mutateAsync(parsed);
      toast.success("Lead created");
      router.push(`/leads/${lead.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
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
  );
}
