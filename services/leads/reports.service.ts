import { api, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  LeadReportParams,
  LeadSourceReportItem,
  LeadStatusReportItem,
  UserPerformanceItem,
  LeadTimeSeriesItem,
} from "@/types";

export const reportsService = {
  sourceReport(params: LeadReportParams): Promise<LeadSourceReportItem[]> {
    return getData<LeadSourceReportItem[]>(`/leads/reports/source${buildQuery(params)}`);
  },

  statusReport(params: LeadReportParams): Promise<LeadStatusReportItem[]> {
    return getData<LeadStatusReportItem[]>(`/leads/reports/status${buildQuery(params)}`);
  },

  userPerformance(params: LeadReportParams): Promise<UserPerformanceItem[]> {
    return getData<UserPerformanceItem[]>(`/leads/reports/user-performance${buildQuery(params)}`);
  },

  timeSeries(params: LeadReportParams): Promise<LeadTimeSeriesItem[]> {
    return getData<LeadTimeSeriesItem[]>(`/leads/reports/time-series${buildQuery(params)}`);
  },

  async exportReport(
    params: LeadReportParams & { format: "xlsx" | "csv" },
  ): Promise<Blob> {
    const res = await api.get(`/leads/reports/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
