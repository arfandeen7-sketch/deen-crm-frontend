import { getData, postData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { Payslip } from "@/types";

export interface PayrollPreviewParams {
  month: number;
  year: number;
  userId?: string;
  overtimeAmount?: number;
}

export const payrollService = {
  preview(params: PayrollPreviewParams): Promise<Payslip> {
    return getData<Payslip>(`/payroll/preview${buildQuery(params)}`);
  },
  calculate(body: PayrollPreviewParams): Promise<Payslip> {
    return postData<Payslip>("/payroll/calculate", body);
  },
};
