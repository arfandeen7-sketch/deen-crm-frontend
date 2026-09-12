import { getData } from "@/services/api/client";
import type {
  AnalyticsPeriod,
  AnalyticsRecentDeal,
  AttentionResponse,
  DashboardSummary,
  EmployeeActivityResponse,
  HrOverview,
  HrTrendPoint,
  MyPerformance,
  SalesOverview,
  SourcePerformanceResponse,
  StatusAnalytics,
  TeamPerformanceResponse,
} from "@/types";

function periodQuery(period: AnalyticsPeriod, extra?: Record<string, string | number>) {
  const params = new URLSearchParams({ period });
  for (const [key, value] of Object.entries(extra ?? {})) {
    params.set(key, String(value));
  }
  return `?${params.toString()}`;
}

export const dashboardService = {
  // ── Legacy widgets ──
  summary(): Promise<DashboardSummary> {
    return getData<DashboardSummary>("/dashboard/summary");
  },
  statusAnalytics(): Promise<StatusAnalytics> {
    return getData<StatusAnalytics>("/dashboard/status-analytics");
  },
  employeeActivity(date?: string): Promise<EmployeeActivityResponse> {
    const qs = date ? `?date=${date}` : "";
    return getData<EmployeeActivityResponse>(`/dashboard/employee-activity${qs}`);
  },

  // ── Sales analytics ──
  salesOverview(period: AnalyticsPeriod): Promise<SalesOverview> {
    return getData<SalesOverview>(`/dashboard/sales-overview${periodQuery(period)}`);
  },
  myPerformance(period: AnalyticsPeriod, activityDays = 14): Promise<MyPerformance> {
    return getData<MyPerformance>(
      `/dashboard/my-performance${periodQuery(period, { activityDays })}`,
    );
  },
  sourcePerformance(period: AnalyticsPeriod): Promise<SourcePerformanceResponse> {
    return getData<SourcePerformanceResponse>(
      `/dashboard/source-performance${periodQuery(period)}`,
    );
  },
  teamPerformance(period: AnalyticsPeriod): Promise<TeamPerformanceResponse> {
    return getData<TeamPerformanceResponse>(
      `/dashboard/team-performance${periodQuery(period)}`,
    );
  },
  attention(): Promise<AttentionResponse> {
    return getData<AttentionResponse>("/dashboard/attention");
  },
  recentDeals(take = 6): Promise<AnalyticsRecentDeal[]> {
    return getData<AnalyticsRecentDeal[]>(`/dashboard/recent-deals?take=${take}`);
  },

  // ── Workforce analytics ──
  hrOverview(date?: string): Promise<HrOverview> {
    const qs = date ? `?date=${date}` : "";
    return getData<HrOverview>(`/dashboard/hr-overview${qs}`);
  },
  hrTrend(days = 30): Promise<HrTrendPoint[]> {
    return getData<HrTrendPoint[]>(`/dashboard/hr-trend?days=${days}`);
  },
};
