"use client";

import { useQuery } from "@tanstack/react-query";
import { followupService } from "@/services/leads/leads.service";
import type { LeadQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";

export type FollowupVariant = "today" | "missed" | "upcoming";

export function useFollowup(variant: FollowupVariant, params: LeadQueryParams) {
  return useQuery({
    queryKey: ["followup", variant, params],
    queryFn: () => followupService[variant](params),
    refetchInterval: POLL_FAST,
  });
}
