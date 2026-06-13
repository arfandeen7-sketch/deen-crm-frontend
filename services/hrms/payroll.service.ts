import { api, getData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { PayrollRecord, PayrollGeneratePayload, PayrollDashboard, Paginated } from "@/types";

export interface PayrollQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  month?: number;
  year?: number;
  status?: string;
}

export const payrollService = {
  async list(params: PayrollQuery = {}): Promise<Paginated<PayrollRecord>> {
    const res = await api.get<Paginated<PayrollRecord>>(
      `/hrms/payroll${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<PayrollRecord> {
    return getData<PayrollRecord>(`/hrms/payroll/${id}`);
  },
  generate(body: PayrollGeneratePayload): Promise<{ count: number }> {
    return postData<{ count: number }>("/hrms/payroll/generate", body);
  },
  process(id: string): Promise<PayrollRecord> {
    return putData<PayrollRecord>(`/hrms/payroll/${id}/process`, {});
  },
  dashboard(params: { month?: number; year?: number } = {}): Promise<PayrollDashboard> {
    return getData<PayrollDashboard>(`/hrms/payroll/dashboard${buildQuery(params)}`);
  },
  async export(params: PayrollQuery = {}): Promise<Blob> {
    const res = await api.get(`/hrms/payroll/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
