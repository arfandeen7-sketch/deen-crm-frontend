import { api } from "@/services/api/client";
import type { DashboardSummary, StatusAnalytics } from "@/types";

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const res = await api.get<DashboardSummary>("/dashboard/summary");
    return res.data;
  },
  async statusAnalytics(): Promise<StatusAnalytics> {
    const res = await api.get<StatusAnalytics>("/dashboard/status-analytics");
    return res.data;
  },
};
