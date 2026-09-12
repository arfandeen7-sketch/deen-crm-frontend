import { deleteData, getData, putData } from "@/services/api/client";
import type { SalesTargetInput, SalesTargetsResponse } from "@/types";

export const targetsService = {
  list(month: number, year: number): Promise<SalesTargetsResponse> {
    return getData<SalesTargetsResponse>(`/targets?month=${month}&year=${year}`);
  },

  save(
    month: number,
    year: number,
    targets: SalesTargetInput[],
  ): Promise<{ month: number; year: number; written: number; cleared: number }> {
    return putData("/targets", { month, year, targets });
  },

  clearMonth(month: number, year: number): Promise<{ deleted: number }> {
    return deleteData(`/targets?month=${month}&year=${year}`);
  },
};
