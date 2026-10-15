"use client";

import { useQuery } from "@tanstack/react-query";
import { dealClosedService } from "@/services/deals/dealClosed.service";
import { retrySkipAuth } from "@/lib/query-gate";
import type { DealClosedQueryParams } from "@/types";

const KEY = "deal-closed";

/** Paginated list of closed deals visible to the current user. */
export function useDealClosedList(params: DealClosedQueryParams = {}) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => dealClosedService.list(params),
    retry: retrySkipAuth,
  });
}

/** Summary stat cards (total value, count, avg, this month). */
export function useDealClosedStats() {
  return useQuery({
    queryKey: [KEY, "stats"],
    queryFn: () => dealClosedService.stats(),
    retry: retrySkipAuth,
  });
}

/** Per-employee breakdown sorted by total sales value desc. */
export function useDealClosedEmployeeSummary(
  params: Pick<DealClosedQueryParams, "closedFrom" | "closedTo"> = {}
) {
  return useQuery({
    queryKey: [KEY, "employee-summary", params],
    queryFn: () => dealClosedService.employeeSummary(params),
    retry: retrySkipAuth,
  });
}

/** Single sale detail (for the Deal Details modal). */
export function useDealClosedDetail(saleId: string | null) {
  return useQuery({
    queryKey: [KEY, "detail", saleId],
    queryFn: () => dealClosedService.getById(saleId as string),
    enabled: !!saleId,
    retry: retrySkipAuth,
  });
}

/** Every active CRM user, for the Deal Closed user filter. */
export function useDealClosedUsers() {
  return useQuery({
    queryKey: [KEY, "users"],
    queryFn: () => dealClosedService.users(),
    staleTime: 5 * 60_000,
    retry: retrySkipAuth,
  });
}

/** Distinct filter values taken from Deal Closed leads. */
export function useDealClosedOptions() {
  return useQuery({
    queryKey: [KEY, "options"],
    queryFn: () => dealClosedService.options(),
    staleTime: 60_000,
    retry: retrySkipAuth,
  });
}
