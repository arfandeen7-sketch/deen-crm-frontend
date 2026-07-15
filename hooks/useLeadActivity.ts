"use client";

import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/leads/activity.service";
import { POLL_FAST } from "@/constants";

export function useLeadActivity(leadId: string) {
  return useQuery({
    queryKey: ["lead-activity", leadId],
    queryFn: () => activityService.forLead(leadId, { pageSize: 50 }),
    enabled: !!leadId,
    refetchInterval: POLL_FAST,
  });
}
