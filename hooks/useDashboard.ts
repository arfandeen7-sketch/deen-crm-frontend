"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { leadsService } from "@/services/leads/leads.service";
import type { LeadQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

export function useDashboardSummary() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:summary"]);
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardService.summary(),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useStatusAnalytics() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:status-analytics"]);
  return useQuery({
    queryKey: ["dashboard", "status-analytics"],
    queryFn: () => dashboardService.statusAnalytics(),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Recent leads for the dashboard table. */
export function useRecentLeads(assignedTo?: string) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:recent-leads"]);
  return useQuery({
    queryKey: ["dashboard", "recent-leads", assignedTo ?? "all"],
    queryFn: () => leadsService.list({ page: 1, pageSize: 10, assignedTo }),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Today's follow-ups count for the dashboard cards. */
export function useTodayFollowupCount() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:followup-today-count"]);
  return useQuery({
    queryKey: ["dashboard", "followup-today-count"],
    queryFn: async () => {
      const { followupService } = await import("@/services/leads/leads.service");
      const res = await followupService.today({ page: 1, pageSize: 1 });
      return res.total;
    },
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useMissedFollowupCount() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:followup-missed-count"]);
  return useQuery({
    queryKey: ["dashboard", "followup-missed-count"],
    queryFn: async () => {
      const { followupService } = await import("@/services/leads/leads.service");
      const res = await followupService.missed({ page: 1, pageSize: 1 });
      return res.total;
    },
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useUpcomingFollowupCount() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:followup-upcoming-count"]);
  return useQuery({
    queryKey: ["dashboard", "followup-upcoming-count"],
    queryFn: async () => {
      const { followupService } = await import("@/services/leads/leads.service");
      const res = await followupService.upcoming({ page: 1, pageSize: 1 });
      return res.total;
    },
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Count of leads in a given status (for the top cards). */
export function useStatusCount(status: string) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:status-count"]);
  return useQuery({
    queryKey: ["dashboard", "status-count", status],
    queryFn: async () => {
      const res = await leadsService.list({ page: 1, pageSize: 1, status });
      return res.total;
    },
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Count of leads in a given category (untouched / imported / assigned / unassigned). */
export function useLeadCategoryCount(
  category: NonNullable<LeadQueryParams["category"]>,
) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:category-count"]);
  return useQuery({
    queryKey: ["dashboard", "category-count", category],
    queryFn: async () => {
      const res = await leadsService.list({ page: 1, pageSize: 1, category });
      return res.total;
    },
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Aggregated per-employee activity for Master/HR dashboards. */
export function useEmployeeActivity(date?: string) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:employee-activity"]);
  return useQuery({
    queryKey: ["dashboard", "employee-activity", date],
    queryFn: () => dashboardService.employeeActivity(date),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}
