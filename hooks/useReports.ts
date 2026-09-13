/**
 * React Query hooks for the reports platform.
 * All hooks use useQueryEnabled + retrySkipAuth + staleTime 60s + placeholderData.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { reportsApiService, type ReportDocumentParams } from "@/services/reports/reports.service";
import type { ReportFormat } from "@/types/reports";

const STALE_TIME = 60_000;

export function useReportCatalog(enabled: boolean) {
  const queryEnabled = useQueryEnabled({ module: "reports" });
  return useQuery({
    queryKey: ["reports:catalog"],
    queryFn: () => reportsApiService.catalog(),
    enabled: queryEnabled && enabled,
    staleTime: STALE_TIME,
    retry: retrySkipAuth,
    placeholderData: (prev) => prev,
  });
}

export function useReportDocument(key: string | undefined, params: ReportDocumentParams) {
  const queryEnabled = useQueryEnabled({ module: "reports" });
  return useQuery({
    queryKey: ["reports:document", key, params],
    queryFn: () => reportsApiService.document(key!, params),
    enabled: queryEnabled && !!key,
    staleTime: STALE_TIME,
    retry: retrySkipAuth,
    placeholderData: (prev) => prev,
  });
}

export function useReportOptions(source: string | undefined) {
  const queryEnabled = useQueryEnabled({ module: "reports" });
  return useQuery({
    queryKey: ["reports:options", source],
    queryFn: () => reportsApiService.options(source!),
    enabled: queryEnabled && !!source,
    staleTime: STALE_TIME * 5,
    retry: retrySkipAuth,
    placeholderData: (prev) => prev,
  });
}

export function useReportDownload() {
  return useMutation({
    mutationFn: ({ key, format, params }: { key: string; format: ReportFormat; params: ReportDocumentParams }) =>
      reportsApiService.download(key, format, params),
  });
}
