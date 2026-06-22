import { getData } from "@/services/api/client";
import type { DashboardSummary, StatusAnalytics } from "@/types";

export const dashboardService = {
  summary(): Promise<DashboardSummary> {
    return getData<DashboardSummary>("/dashboard/summary");
  },
  statusAnalytics(): Promise<StatusAnalytics> {
    return getData<StatusAnalytics>("/dashboard/status-analytics");
  },
};
