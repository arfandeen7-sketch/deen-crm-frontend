import { api, getData, postData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { Payslip, Paginated } from "@/types";

export interface PayslipQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  month?: number;
  year?: number;
}

export const payslipService = {
  async list(params: PayslipQuery = {}): Promise<Paginated<Payslip>> {
    const res = await api.get<Paginated<Payslip>>(
      `/hrms/payslips${buildQuery(params)}`,
    );
    return res.data;
  },
  async myList(params: Omit<PayslipQuery, "userId"> = {}): Promise<Paginated<Payslip>> {
    const res = await api.get<Paginated<Payslip>>(
      `/hrms/my/payslips${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<Payslip> {
    return getData<Payslip>(`/hrms/payslips/${id}`);
  },
  async downloadPdf(id: string): Promise<Blob> {
    const res = await api.get(`/hrms/payslips/${id}/pdf`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
  sendEmail(id: string): Promise<{ success: boolean }> {
    return postData<{ success: boolean }>(`/hrms/payslips/${id}/send-email`, {});
  },
  sendBulkEmails(ids: string[]): Promise<{ sent: number; failed: number }> {
    return postData<{ sent: number; failed: number }>("/hrms/payslips/send-bulk-email", { ids });
  },
  async export(params: PayslipQuery = {}): Promise<Blob> {
    const res = await api.get(`/hrms/payslips/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
