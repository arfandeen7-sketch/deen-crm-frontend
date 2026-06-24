import { api, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  LeadReportParams,
  LeadReportResponse,
  LeadSourceReportItem,
  LeadStatusReportItem,
  UserPerformanceItem,
  LeadTimeSeriesItem,
  StatusAnalytics,
} from "@/types";

type ReportQueryParams = Omit<LeadReportParams, "period"> & { groupBy?: "user" | "source"; userId?: string; source?: string };

export const reportsService = {
  async sourceReport(params: LeadReportParams): Promise<LeadSourceReportItem[]> {
    const p: ReportQueryParams = { groupBy: "source", dateFrom: params.dateFrom, dateTo: params.dateTo };
    const res = await getData<LeadReportResponse>(`/leads/report${buildQuery(p)}`);
    const rows = res.rows ?? [];
    const total = rows.reduce((s, r) => s + r.totalAssigned, 0) || 1;
    return rows.map((r) => ({
      source: r.groupLabel,
      count: r.totalAssigned,
      percentage: (r.totalAssigned / total) * 100,
    }));
  },

  async statusReport(params: LeadReportParams): Promise<LeadStatusReportItem[]> {
    const analytics = await getData<StatusAnalytics>("/dashboard/status-analytics");
    const rows = analytics.analytics ?? [];
    const total = rows.reduce((s, r) => s + r.leadCount, 0) || 1;
    return rows.map((r) => ({
      status: r.status,
      count: r.leadCount,
      percentage: (r.leadCount / total) * 100,
    }));
  },

  async userPerformance(params: LeadReportParams): Promise<UserPerformanceItem[]> {
    const p: ReportQueryParams = { groupBy: "user", dateFrom: params.dateFrom, dateTo: params.dateTo };
    const res = await getData<LeadReportResponse>(`/leads/report${buildQuery(p)}`);
    return (res.rows ?? []).map((r) => ({
      userId: r.groupKey,
      fullName: r.groupLabel,
      assigned: r.totalAssigned,
      touched: r.touched,
      untouched: r.untouched,
      followedUp: r.followedUp,
      missedFollowUps: r.missedFollowUps,
      statusBreakdown: r.statusBreakdown,
      lastActivityAt: r.lastActivityAt,
    }));
  },

  timeSeries(_params: LeadReportParams): Promise<LeadTimeSeriesItem[]> {
    return Promise.resolve([]);
  },

  async exportReport(
    params: LeadReportParams & { format: "xlsx" | "csv" },
  ): Promise<Blob> {
    const p: ReportQueryParams = { groupBy: "user", dateFrom: params.dateFrom, dateTo: params.dateTo };
    const res = await api.get(`/leads/report/export${buildQuery(p)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
