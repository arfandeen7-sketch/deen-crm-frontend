"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";
import { AccessGuard } from "@/components/shared/Guards";

export default function UntouchedLeadsPage() {
  return (
    <AccessGuard module="leads" page="untouched_leads">
      <div className="space-y-5">
        <LeadTabs />
        <PageHeader
          title="Untouched Leads"
          subtitle="Leads with no follow-up activity, status update, or assigned action"
        />
        <TypedLeadsView category="untouched" enableBulk />
      </div>
    </AccessGuard>
  );
}
