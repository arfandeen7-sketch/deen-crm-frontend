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
      `/payslips${buildQuery(params)}`,
    );
    return res.data;
  },
  async myList(params: Omit<PayslipQuery, "userId"> = {}): Promise<Paginated<Payslip>> {
    const res = await api.get<Paginated<Payslip>>(
      `/me/payslips${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<Payslip> {
    return getData<Payslip>(`/payslips/${id}`);
  },
  generatePdf(id: string): Promise<Payslip> {
    return postData<Payslip>(`/payslips/${id}/generate`, {});
  },
  async download(id: string, self = false): Promise<Blob> {
    const path = self ? `/me/payslips/${id}/download` : `/payslips/${id}/download`;
    const res = await api.get(path, { responseType: "blob" });
    return res.data as Blob;
  },
  send(id: string): Promise<Payslip> {
    return postData<Payslip>(`/payslips/${id}/send`, {});
  },
  sendBulk(month: number, year: number): Promise<{ sent: number; total: number; errors: unknown[] }> {
    return postData<{ sent: number; total: number; errors: unknown[] }>("/payslips/send-bulk", { month, year });
  },
};
