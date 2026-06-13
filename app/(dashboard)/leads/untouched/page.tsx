"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";

export default function UntouchedLeadsPage() {
  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="Untouched Leads"
        subtitle="Leads with no follow-up activity, status update, or assigned action"
      />
      <TypedLeadsView category="untouched" enableBulk />
    </div>
  );
}
