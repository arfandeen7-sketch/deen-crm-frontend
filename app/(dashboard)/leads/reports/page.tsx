"use client";

import { useReportCatalog } from "@/hooks/useReports";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { ReportShell } from "@/components/reports/ReportShell";
import { LeadTabs } from "@/components/leads/LeadTabs";

/**
 * Legacy /leads/reports path — re-implemented as a thin wrapper that renders
 * the `lead-performance` report page component, so nav.config.ts, deep links
 * and muscle memory keep working. Keep the <LeadTabs /> header.
 */
export default function LeadReportsPage() {
  const catalogQuery = useReportCatalog(true);

  if (catalogQuery.isLoading || catalogQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingState label="Loading report…" />
      </div>
    );
  }

  if (catalogQuery.isError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ErrorState message="Could not load the report catalog." />
      </div>
    );
  }

  const entry = catalogQuery.data?.find((r) => r.key === "lead-performance");

  if (!entry) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ErrorState message="This report does not exist or you do not have access to it." />
      </div>
    );
  }

  return (
    <AccessGuard module="reports" page="lead_performance" action="view">
      <LeadTabs />
      <ReportShell entry={entry} />
    </AccessGuard>
  );
}
