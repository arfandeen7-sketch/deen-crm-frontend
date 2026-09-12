"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import { targetsService } from "@/services/dashboard/targets.service";
import { getErrorMessage } from "@/services/api/client";
import { ANALYTICS_POLL, ANALYTICS_STALE } from "@/constants";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";
import { retrySkipAuth, useQueryEnabled } from "@/lib/query-gate";
import type { AnalyticsPeriod, SalesTargetInput } from "@/types";

/**
 * Shared query options for the analytics endpoints.
 *
 * Unlike the list-backed dashboard hooks in useDashboard.ts (which poll every
 * 20 s), these run multi-table aggregates — they are cached for two minutes and
 * refreshed in the background every five.
 */
function analyticsOptions(enabled: boolean) {
  return {
    enabled,
    staleTime: ANALYTICS_STALE,
    refetchInterval: enabled ? ANALYTICS_POLL : (false as const),
    refetchOnWindowFocus: false,
    retry: retrySkipAuth,
    /** Keeps the previous period's chart on screen while the new one loads. */
    placeholderData: <T,>(previous: T) => previous,
  };
}

export function useSalesOverview(period: AnalyticsPeriod) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:sales-overview"]);
  return useQuery({
    queryKey: ["dashboard", "sales-overview", period],
    queryFn: () => dashboardService.salesOverview(period),
    ...analyticsOptions(enabled),
  });
}

export function useMyPerformance(period: AnalyticsPeriod, activityDays = 14) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:my-performance"]);
  return useQuery({
    queryKey: ["dashboard", "my-performance", period, activityDays],
    queryFn: () => dashboardService.myPerformance(period, activityDays),
    ...analyticsOptions(enabled),
  });
}

export function useSourcePerformance(period: AnalyticsPeriod) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:source-performance"]);
  return useQuery({
    queryKey: ["dashboard", "source-performance", period],
    queryFn: () => dashboardService.sourcePerformance(period),
    ...analyticsOptions(enabled),
  });
}

export function useTeamPerformance(period: AnalyticsPeriod) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:team-performance"]);
  return useQuery({
    queryKey: ["dashboard", "team-performance", period],
    queryFn: () => dashboardService.teamPerformance(period),
    ...analyticsOptions(enabled),
  });
}

export function useAttention() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:attention"]);
  return useQuery({
    queryKey: ["dashboard", "attention"],
    queryFn: () => dashboardService.attention(),
    ...analyticsOptions(enabled),
  });
}

export function useAnalyticsRecentDeals(take = 6) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:recent-deals"]);
  return useQuery({
    queryKey: ["dashboard", "recent-deals", take],
    queryFn: () => dashboardService.recentDeals(take),
    ...analyticsOptions(enabled),
  });
}

export function useHrOverview(date?: string) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:hr-overview"]);
  return useQuery({
    queryKey: ["dashboard", "hr-overview", date ?? "today"],
    queryFn: () => dashboardService.hrOverview(date),
    ...analyticsOptions(enabled),
  });
}

export function useHrTrend(days = 30) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dashboard:hr-trend"]);
  return useQuery({
    queryKey: ["dashboard", "hr-trend", days],
    queryFn: () => dashboardService.hrTrend(days),
    ...analyticsOptions(enabled),
  });
}

// ── Sales targets ───────────────────────────────────────────────────────────

export function useSalesTargets(month: number, year: number) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["targets:list"]);
  return useQuery({
    queryKey: ["targets", month, year],
    queryFn: () => targetsService.list(month, year),
    enabled,
    staleTime: ANALYTICS_STALE,
    retry: retrySkipAuth,
  });
}

export function useSaveSalesTargets(month: number, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targets: SalesTargetInput[]) =>
      targetsService.save(month, year, targets),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      // Target changes shift every gauge on the dashboards.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const cleared = result.cleared
        ? ` ${result.cleared} cleared.`
        : "";
      toast.success(`Targets saved.${cleared}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useClearSalesTargets(month: number, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => targetsService.clearMonth(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Targets cleared for this month.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
