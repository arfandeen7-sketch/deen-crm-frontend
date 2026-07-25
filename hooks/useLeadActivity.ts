"use client";

import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/leads/activity.service";
import { POLL_FAST } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

export function useLeadActivity(leadId: string) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["leads:detail"]);
  const enabled = !!leadId && hasPermission;
  return useQuery({
    queryKey: ["lead-activity", leadId],
    queryFn: () => activityService.forLead(leadId, { pageSize: 50 }),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}
