/**
 * Reports API service — catalog, document JSON, and export downloads.
 * Uses the same getData<T>() / buildQuery / downloadBlob conventions as
 * the rest of the app.
 */
import { api, getData } from "@/services/api/client";
import { buildQuery, downloadBlob } from "@/lib/utils";
import type {
  ReportCatalogEntry,
  ReportDocument,
  ReportFormat,
  FilterOption,
} from "@/types/reports";

export interface ReportDocumentParams {
  period?: string;
  from?: string;
  to?: string;
  granularity?: string;
  [key: string]: string | undefined;
}

export const reportsApiService = {
  async catalog(): Promise<ReportCatalogEntry[]> {
    return getData<ReportCatalogEntry[]>("/reports");
  },

  async options(source: string): Promise<FilterOption[]> {
    return getData<FilterOption[]>(`/reports/options${buildQuery({ source })}`);
  },

  async document(key: string, params: ReportDocumentParams): Promise<ReportDocument> {
    return getData<ReportDocument>(`/reports/${key}${buildQuery(params)}`);
  },

  /** Build a URL for browser-opened export links (new tab). */
  exportUrl(key: string, format: ReportFormat, params: ReportDocumentParams): string {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const qs = buildQuery({ ...params, format }).replace(/^\?/, "");
    return `${base}/api/reports/${key}/export?${qs}`;
  },

  /** Download an export as a blob (for in-app buttons). */
  async download(key: string, format: ReportFormat, params: ReportDocumentParams): Promise<void> {
    const res = await api.get(`/reports/${key}/export`, {
      params: { ...params, format },
      responseType: "blob",
    });

    // Prefer the server-provided filename from Content-Disposition.
    const cd = res.headers["content-disposition"] as string | undefined;
    let filename = `deen-${key}.${format}`;
    if (cd) {
      const match = cd.match(/filename="([^"]+)"/);
      if (match) filename = match[1];
    }

    downloadBlob(res.data as Blob, filename);
  },
};
