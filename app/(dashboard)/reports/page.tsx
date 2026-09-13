"use client";

import { useMemo } from "react";
import { useReportCatalog } from "@/hooks/useReports";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { ReportCatalogCard } from "@/components/reports/ReportCatalogCard";
import type { ReportCatalogEntry } from "@/types/reports";

const DOMAIN_LABELS: Record<string, string> = {
  sales: "Sales",
  hr: "Human Resources",
  portfolio: "Portfolio",
};

export default function ReportsHubPage() {
  return (
    <AccessGuard module="reports">
      <ReportsHubContent />
    </AccessGuard>
  );
}

function ReportsHubContent() {
  const catalogQuery = useReportCatalog(true);

  const grouped = useMemo(() => {
    if (!catalogQuery.data) return null;
    const groups: Record<string, ReportCatalogEntry[]> = {};
    for (const entry of catalogQuery.data) {
      const domain = entry.domain;
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(entry);
    }
    return groups;
  }, [catalogQuery.data]);

  if (catalogQuery.isLoading || catalogQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState label="Loading reports…" />
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

  if (!grouped || Object.keys(grouped).length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-neutral-400">No reports are available for your role.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
      <div className="space-y-1" data-print="hide">
        <h1 className="font-secondary text-2xl font-bold tracking-tight text-neutral-900">
          Reports
        </h1>
        <p className="text-sm text-neutral-500">
          Unified reporting across sales, HR, and portfolio. Export any report to PDF, Excel, Word, or CSV.
        </p>
      </div>

      {Object.entries(grouped).map(([domain, entries]) => (
        <section key={domain} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            {DOMAIN_LABELS[domain] ?? domain}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <ReportCatalogCard key={entry.key} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
