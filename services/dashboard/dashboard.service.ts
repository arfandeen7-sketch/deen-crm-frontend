import { getData } from "@/services/api/client";
import type { DashboardSummary, StatusAnalytics, EmployeeActivityResponse } from "@/types";

export const dashboardService = {
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
};
