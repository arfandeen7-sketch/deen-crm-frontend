"use client";

import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/leads/activity.service";

export function useLeadActivity(leadId: string) {
  return useQuery({
    queryKey: ["lead-activity", leadId],
    queryFn: () => activityService.forLead(leadId, { pageSize: 50 }),
    enabled: !!leadId,
    staleTime: 30_000,
  });
}
