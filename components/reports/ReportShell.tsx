"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useReportDocument } from "@/hooks/useReports";
import type { ReportDocumentParams } from "@/services/reports/reports.service";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { ReportRenderer } from "./ReportRenderer";
import { ReportMetaStrip } from "./ReportMetaStrip";
import { ReportFilterBar } from "./ReportFilterBar";
import { ExportMenu } from "./ExportMenu";
import type { ReportCatalogEntry } from "@/types/reports";

export function ReportShell({
  entry,
  lockedFilters,
  hideBackLink,
}: {
  entry: ReportCatalogEntry;
  lockedFilters?: Record<string, string>;
  hideBackLink?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo<ReportDocumentParams>(() => {
    const p: ReportDocumentParams = {};
    const period = searchParams.get("period");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (period) p.period = period;
    if (from) p.from = from;
    if (to) p.to = to;
    for (const spec of entry.filterSpec) {
      // Locked filters take precedence over URL params
      if (lockedFilters && lockedFilters[spec.key]) {
        p[spec.key] = lockedFilters[spec.key];
      } else {
        const v = searchParams.get(spec.key);
        if (v) p[spec.key] = v;
      }
    }
    // Also apply locked filters not in the spec (e.g. userId)
    if (lockedFilters) {
      for (const [k, v] of Object.entries(lockedFilters)) {
        if (!p[k]) p[k] = v;
      }
    }
    return p;
  }, [searchParams, entry.filterSpec, lockedFilters]);

  const docQuery = useReportDocument(entry.key, params);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      router.push(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4" data-print="hide">
        <div className="space-y-1">
          {!hideBackLink && (
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All reports
            </Link>
          )}
          <h1 className="font-secondary text-2xl font-bold tracking-tight text-neutral-900">
            {entry.title}
          </h1>
          <p className="text-sm text-neutral-500">{entry.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          {docQuery.data && <ExportMenu meta={docQuery.data.meta} params={params} />}
        </div>
      </div>

      {/* Print-only title */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">{entry.title}</h1>
        <p className="text-sm text-neutral-500">{entry.subtitle}</p>
      </div>

      {/* Filters */}
      <ReportFilterBar
        filterSpec={entry.filterSpec.filter((s) => !lockedFilters?.[s.key])}
        params={params}
        onChange={handleFilterChange}
      />

      {/* Body */}
      {docQuery.isLoading || docQuery.isPending ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingState label="Compiling report…" />
        </div>
      ) : docQuery.isError ? (
        <ErrorState message="Could not load this report. Please try again." />
      ) : docQuery.data ? (
        <>
          <ReportMetaStrip meta={docQuery.data.meta} />
          <ReportRenderer doc={docQuery.data} />
          {docQuery.data.meta.caveats.length > 0 && (
            <div className="space-y-1 border-t border-neutral-200 pt-4" data-print="block">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Caveats</p>
              <ul className="space-y-1">
                {docQuery.data.meta.caveats.map((c, i) => (
                  <li key={i} className="text-xs italic text-neutral-400">• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
