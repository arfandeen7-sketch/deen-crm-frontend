import { api, getData, postData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import { CONVERTED_LEAD_STATUSES } from "@/constants";
import type {
  LeadReportParams,
  LeadReportResponse,
  LeadSourceReportItem,
  LeadStatusReportItem,
  UserPerformanceItem,
  LeadTimeSeriesItem,
  StatusAnalytics,
  LeadPriorityReportItem,
  LeadGeoReportItem,
  LeadReportSummary,
} from "@/types";

type ReportQueryParams = Omit<LeadReportParams, "period"> & {
  groupBy?: "user" | "source" | "priority" | "city";
  userId?: string;
  source?: string;
};

function convertedCount(statusBreakdown: Record<string, number> | undefined): number {
  if (!statusBreakdown) return 0;
  return CONVERTED_LEAD_STATUSES.reduce((sum, s) => sum + (statusBreakdown[s] ?? 0), 0);
}

export const reportsService = {
  async sourceReport(params: LeadReportParams): Promise<LeadSourceReportItem[]> {
    const p: ReportQueryParams = { groupBy: "source", dateFrom: params.dateFrom, dateTo: params.dateTo };
    const res = await getData<LeadReportResponse>(`/leads/report${buildQuery(p)}`);
    const rows = res.rows ?? [];
    const total = rows.reduce((s, r) => s + r.totalAssigned, 0) || 1;
    return rows.map((r) => {
      const converted = convertedCount(r.statusBreakdown);
      return {
        source: r.groupLabel,
        count: r.totalAssigned,
        percentage: (r.totalAssigned / total) * 100,
        touched: r.touched,
        converted,
        conversionRate: r.totalAssigned > 0 ? (converted / r.totalAssigned) * 100 : 0,
        statusBreakdown: r.statusBreakdown,
      };
    });
  },

  /**
   * NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/priority
   * Expected response: { data: { priority: string; count: number }[] }
   */
  async priorityReport(params: LeadReportParams): Promise<LeadPriorityReportItem[]> {
    const rows = await getData<{ priority: string; count: number }[]>(
      `/leads/report/priority${buildQuery({ dateFrom: params.dateFrom, dateTo: params.dateTo })}`,
    );
    const total = rows.reduce((s, r) => s + r.count, 0) || 1;
    return rows.map((r) => ({
      priority: r.priority,
      count: r.count,
      percentage: (r.count / total) * 100,
    }));
  },

  /**
   * NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/geo
   * Expected response: { data: { city: string; count: number }[] }
   */
  async geoReport(params: LeadReportParams): Promise<LeadGeoReportItem[]> {
    const rows = await getData<{ city: string; count: number }[]>(
      `/leads/report/geo${buildQuery({ dateFrom: params.dateFrom, dateTo: params.dateTo })}`,
    );
    const total = rows.reduce((s, r) => s + r.count, 0) || 1;
    return rows.map((r) => ({
      city: r.city,
      count: r.count,
      percentage: (r.count / total) * 100,
    }));
  },

  /**
   * NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/summary
   * Expected response: { data: { newLeads: number; avgResponseTimeMinutes: number | null } }
   */
  summary(params: LeadReportParams): Promise<LeadReportSummary> {
    return getData<LeadReportSummary>(
      `/leads/report/summary${buildQuery({ dateFrom: params.dateFrom, dateTo: params.dateTo })}`,
    );
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

  /**
   * NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/timeseries
   * Expected response: { data: { date: string; count: number }[] }
   * `date` bucketed by the requested `period` (daily/weekly/monthly).
   */
  timeSeries(params: LeadReportParams): Promise<LeadTimeSeriesItem[]> {
    return getData<LeadTimeSeriesItem[]>(
      `/leads/report/timeseries${buildQuery({
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        period: params.period ?? "daily",
      })}`,
    );
  },

  async exportReport(
    params: LeadReportParams & { format: "xlsx" | "csv"; userId?: string },
  ): Promise<Blob> {
    const p: ReportQueryParams = {
      groupBy: "user",
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      userId: params.userId,
    };
    const res = await api.get(`/leads/report/export${buildQuery({ ...p, format: params.format })}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  /**
   * NEW BACKEND ENDPOINT REQUIRED: POST /leads/report/employee/:userId/remind
   * Sends a reminder notification/email to the employee about missed follow-ups.
   * Expected response: { data: { success: true } }
   */
  sendReminder(userId: string): Promise<{ success: true }> {
    return postData<{ success: true }>(`/leads/report/employee/${userId}/remind`);
  },
};
