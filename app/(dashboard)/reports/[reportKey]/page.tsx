"use client";

import { use } from "react";
import { useReportCatalog } from "@/hooks/useReports";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { ReportShell } from "@/components/reports/ReportShell";

export default function ReportPage({ params }: { params: Promise<{ reportKey: string }> }) {
  const { reportKey } = use(params);
  const permissionPage = reportKey.replace(/-/g, "_");
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

  const entry = catalogQuery.data?.find((r) => r.key === reportKey);

  if (!entry) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ErrorState message="This report does not exist or you do not have access to it." />
      </div>
    );
  }

  return (
    <AccessGuard module="reports" page={permissionPage} action="view">
      <ReportShell entry={entry} />
    </AccessGuard>
  );
}
