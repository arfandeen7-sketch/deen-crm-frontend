import { api, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  ClosedDeal,
  DealClosedQueryParams,
  DealClosedStats,
  DealEmployeeSummary,
  Paginated,
} from "@/types";

export const dealClosedService = {
  /** GET /api/leads/deal-closed — paginated list */
  async list(params: DealClosedQueryParams = {}): Promise<Paginated<ClosedDeal>> {
    const res = await api.get<Paginated<ClosedDeal>>(
      `/leads/deal-closed${buildQuery(params)}`
    );
    return res.data;
  },

  /** GET /api/leads/deal-closed/stats — summary cards */
  stats(): Promise<DealClosedStats> {
    return getData<DealClosedStats>("/leads/deal-closed/stats");
  },

  /** GET /api/leads/deal-closed/employee-summary — per-employee breakdown */
  employeeSummary(params: Pick<DealClosedQueryParams, "closedFrom" | "closedTo"> = {}): Promise<DealEmployeeSummary[]> {
    return getData<DealEmployeeSummary[]>(
      `/leads/deal-closed/employee-summary${buildQuery(params)}`
    );
  },

  /** GET /api/leads/deal-closed/:saleId — single sale detail */
  getById(saleId: string): Promise<ClosedDeal> {
    return getData<ClosedDeal>(`/leads/deal-closed/${saleId}`);
  },
};
