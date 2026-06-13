import { api } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";

export interface HrReportQuery {
  dateFrom?: string;
  dateTo?: string;
  month?: number;
  year?: number;
  userId?: string;
  department?: string;
}

export type HrReportType =
  | "attendance"
  | "leave"
  | "payroll"
  | "salary"
  | "employee"
  | "login-activity";

export const hrReportsService = {
  async getReport(type: HrReportType, params: HrReportQuery = {}): Promise<unknown> {
    const res = await api.get(`/hrms/reports/${type}${buildQuery(params)}`);
    return res.data;
  },
  async exportReport(
    type: HrReportType,
    format: "excel" | "csv" | "pdf",
    params: HrReportQuery = {},
  ): Promise<Blob> {
    const res = await api.get(
      `/hrms/reports/${type}/export?format=${format}${buildQuery(params).replace("?", "&")}`,
      { responseType: "blob" },
    );
    return res.data as Blob;
  },
};
