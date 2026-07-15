"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { leadsService } from "@/services/leads/leads.service";
import type { LeadQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.summary(),
    refetchInterval: POLL_FAST,
  });
}

export function useStatusAnalytics() {
  return useQuery({
    queryKey: ["dashboard", "status-analytics"],
    queryFn: () => dashboardService.statusAnalytics(),
    refetchInterval: POLL_FAST,
  });
}

/** Recent leads for the dashboard table. */
export function useRecentLeads() {
  return useQuery({
    queryKey: ["dashboard", "recent-leads"],
    queryFn: () => leadsService.list({ page: 1, pageSize: 8 }),
    refetchInterval: POLL_FAST,
  });
}

/** Today's follow-ups count for the dashboard cards. */
export function useTodayFollowupCount() {
  return useQuery({
    queryKey: ["dashboard", "followup-today-count"],
    queryFn: async () => {
      const { followupService } = await import("@/services/leads/leads.service");
      const res = await followupService.today({ page: 1, pageSize: 1 });
      return res.total;
    },
    refetchInterval: POLL_FAST,
  });
}

export function useMissedFollowupCount() {
  return useQuery({
    queryKey: ["dashboard", "followup-missed-count"],
    queryFn: async () => {
      const { followupService } = await import("@/services/leads/leads.service");
      const res = await followupService.missed({ page: 1, pageSize: 1 });
      return res.total;
    },
    refetchInterval: POLL_FAST,
  });
}

/** Count of leads in a given status (for the top cards). */
export function useStatusCount(status: string) {
  return useQuery({
    queryKey: ["dashboard", "status-count", status],
    queryFn: async () => {
      const res = await leadsService.list({ page: 1, pageSize: 1, status });
      return res.total;
    },
    refetchInterval: POLL_FAST,
  });
}

/** Count of leads in a given category (untouched / imported / assigned / unassigned). */
export function useLeadCategoryCount(
  category: NonNullable<LeadQueryParams["category"]>,
) {
  return useQuery({
    queryKey: ["dashboard", "category-count", category],
    queryFn: async () => {
      const res = await leadsService.list({ page: 1, pageSize: 1, category });
      return res.total;
    },
    refetchInterval: POLL_FAST,
  });
}
