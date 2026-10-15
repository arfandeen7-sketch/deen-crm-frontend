import { api, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  ClosedDeal,
  DealClosedFilterOptions,
  DealClosedListItem,
  DealClosedQueryParams,
  DealClosedStats,
  DealClosedUserOption,
  DealEmployeeSummary,
  Paginated,
} from "@/types";

export const dealClosedService = {
  /** GET /api/leads/deal-closed — paginated list */
  async list(params: DealClosedQueryParams = {}): Promise<Paginated<DealClosedListItem>> {
    const res = await api.get<Paginated<DealClosedListItem>>(
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

  users(): Promise<DealClosedUserOption[]> {
    return getData<DealClosedUserOption[]>("/leads/deal-closed/users");
  },

  options(): Promise<DealClosedFilterOptions> {
    return getData<DealClosedFilterOptions>("/leads/deal-closed/options");
  },
};
