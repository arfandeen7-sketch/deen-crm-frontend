"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { TypedLeadsView } from "@/components/leads/TypedLeadsView";
import { AccessGuard } from "@/components/shared/Guards";

export default function FreshLeadsPage() {
  return (
    <AccessGuard module="leads" page="fresh_leads">
      <div className="space-y-5">
        <LeadTabs />
        <PageHeader
          title="Fresh Leads"
          subtitle="Newly created leads with no prior activity"
        />
        <TypedLeadsView category="fresh" enableBulk />
      </div>
    </AccessGuard>
  );
}
