"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/leads/reports.service";
import { POLL_SLOW } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";
import type { LeadReportParams, LeadActivity } from "@/types";

const KEY = "lead-reports";

// Re-export so existing import sites for the activity type keep working.
export type { LeadActivity };

/**
 * Per-employee historical report — used by the EmployeeHistoricalReportModal
 * drill-down. All other report hooks that used to live here have been
 * superseded by the unified /reports platform (see components/reports/*).
 */
export function useEmployeeReport(userId: string | undefined, params: LeadReportParams) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["lead-reports:employee-activity"]);
  const enabled = !!userId && hasPermission;
  return useQuery({
    queryKey: [KEY, "employee-report", userId, params],
    queryFn: () => reportsService.employeeReport({ ...params, userId: userId! }),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}
