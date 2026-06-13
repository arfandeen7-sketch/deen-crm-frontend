"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";

export default function AssignedLeadsPage() {
  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="Assigned Leads"
        subtitle="Leads assigned to a sales executive or manager"
      />
      <TypedLeadsView category="assigned" />
    </div>
  );
}
