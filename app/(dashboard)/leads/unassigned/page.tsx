"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";
import { AccessGuard } from "@/components/shared/Guards";

export default function UnassignedLeadsPage() {
  return (
    <AccessGuard module="leads" page="unassigned_leads" action="view">
      <div className="space-y-5">
        <LeadTabs />
        <PageHeader
          title="Non Assigned Leads"
          subtitle="Leads without an assigned sales representative"
        />
        <TypedLeadsView category="unassigned" enableBulk />
      </div>
    </AccessGuard>
  );
}
