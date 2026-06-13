"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/leads/reports.service";
import type { LeadReportParams } from "@/types";

const KEY = "lead-reports";

export function useSourceReport(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "source", params],
    queryFn: () => reportsService.sourceReport(params),
  });
}

export function useStatusReport(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "status", params],
    queryFn: () => reportsService.statusReport(params),
  });
}

export function useUserPerformance(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "user-performance", params],
    queryFn: () => reportsService.userPerformance(params),
  });
}

export function useLeadTimeSeries(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "time-series", params],
    queryFn: () => reportsService.timeSeries(params),
  });
}
