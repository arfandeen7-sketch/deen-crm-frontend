"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";

export default function ImportedLeadsPage() {
  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="Imported Leads"
        subtitle="Leads imported via Excel/CSV upload or synced from external sources"
      />
      <TypedLeadsView category="imported" />
    </div>
  );
}
