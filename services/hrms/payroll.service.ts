import { getData, postData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { PayrollFigures, Payslip } from "@/types";

export interface PayrollPreviewParams {
  month: number;
  year: number;
  userId?: string;
  overtimeAmount?: number;
}

export const payrollService = {
  /**
   * GET /payroll/preview — compute figures without persisting.
   * Returns a single `PayrollFigures` when `userId` is supplied, otherwise
   * an array of `PayrollFigures` for every active salaried non-master employee.
   */
  preview(params: PayrollPreviewParams): Promise<PayrollFigures | PayrollFigures[]> {
    return getData<PayrollFigures | PayrollFigures[]>(`/payroll/preview${buildQuery(params)}`);
  },
  /**
   * POST /payroll/calculate — compute + upsert draft Payslip(s).
   * Returns a single `Payslip` when `userId` is supplied, otherwise an array.
   */
  calculate(body: PayrollPreviewParams): Promise<Payslip | Payslip[]> {
    return postData<Payslip | Payslip[]>("/payroll/calculate", body);
  },
  runMonthly(month?: number, year?: number): Promise<{ month: number; year: number; sent: number; total: number; errors: unknown[] }> {
    return postData<{ month: number; year: number; sent: number; total: number; errors: unknown[] }>("/payroll/run-monthly", { month, year });
  },
};
