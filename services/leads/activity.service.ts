import { getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { LeadActivity, Paginated } from "@/types";

export interface ActivityQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const activityService = {
  forLead(leadId: string, params: ActivityQuery = {}): Promise<Paginated<LeadActivity>> {
    return getData<Paginated<LeadActivity>>(`/leads/${leadId}/activity${buildQuery(params)}`);
  },

  global(params: ActivityQuery = {}): Promise<Paginated<LeadActivity>> {
    return getData<Paginated<LeadActivity>>(`/leads/activity${buildQuery(params)}`);
  },
};
