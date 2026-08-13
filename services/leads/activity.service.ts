import { getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  AssignmentHistoryResponse,
  FollowupHistoryResponse,
  LeadActivity,
  Paginated,
} from "@/types";

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

  assignmentHistory(leadId: string): Promise<AssignmentHistoryResponse> {
    return getData<AssignmentHistoryResponse>(`/leads/${leadId}/assignment-history`);
  },

  followupHistory(leadId: string): Promise<FollowupHistoryResponse> {
    return getData<FollowupHistoryResponse>(`/leads/${leadId}/followup-history`);
  },
};
