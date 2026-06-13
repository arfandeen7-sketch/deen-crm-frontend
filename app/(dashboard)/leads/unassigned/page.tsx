"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";

export default function UnassignedLeadsPage() {
  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="Non Assigned Leads"
        subtitle="Leads without an assigned sales representative"
      />
      <TypedLeadsView category="unassigned" enableBulk />
    </div>
  );
}
