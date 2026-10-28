"use client";

import { useQuery } from "@tanstack/react-query";
import { followupService } from "@/services/leads/leads.service";
import type { LeadQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

export type FollowupVariant = "today" | "missed" | "upcoming";

export function useFollowup(variant: FollowupVariant, params: LeadQueryParams, enabled = true) {
  const permitted = useQueryEnabled(QUERY_REQUIREMENTS["leads:followup"]);
  const active = permitted && enabled;
  return useQuery({
    queryKey: ["followup", variant, params],
    queryFn: () => followupService[variant](params),
    enabled: active,
    refetchInterval: active ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}
