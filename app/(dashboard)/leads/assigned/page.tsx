"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";
import { AccessGuard } from "@/components/shared/Guards";

export default function AssignedLeadsPage() {
  return (
    <AccessGuard module="leads" page="assigned_leads">
      <div className="space-y-5">
        <LeadTabs />
        <PageHeader
          title="Assigned Leads"
          subtitle="Leads assigned to a sales executive or manager"
        />
        <TypedLeadsView category="assigned" />
      </div>
    </AccessGuard>
  );
}
