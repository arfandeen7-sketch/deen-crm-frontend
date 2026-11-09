"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  openHouseEventLeadsService,
  openHouseEventsService,
  openHouseRsvpsService,
  type OpenHouseEventLeadQueryParams,
  type OpenHouseEventQueryParams,
  type OpenHouseRsvpQueryParams,
} from "@/services/openHouse/openHouse.service";
import { POLL_FAST } from "@/constants";
import {
  OPEN_HOUSE_EVENTS_PAGE,
  OPEN_HOUSE_LEADS_PAGE,
  OPEN_HOUSE_MODULE,
  OPEN_HOUSE_RSVP_PAGE,
} from "@/constants/openHouse";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";
import { usePermissions } from "@/contexts/PermissionContext";
import { useAuth } from "@/hooks/useAuth";

const KEY = "open-house";

export function useOpenHouseEventsList(params: OpenHouseEventQueryParams) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["open-house-events:list"]);
  return useQuery({
    queryKey: [KEY, "events", "list", params],
    queryFn: () => openHouseEventsService.list(params),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Event dropdown — available to anyone who can view events or view/create/edit event leads. */
export function useOpenHouseEventOptions() {
  const { permissionStatus } = useAuth();
  const { canAction } = usePermissions();
  const enabled =
    permissionStatus === "ready" &&
    (canAction(OPEN_HOUSE_MODULE, OPEN_HOUSE_EVENTS_PAGE, "view") ||
      (["view", "create", "edit"] as const).some(
        (a) =>
          canAction(OPEN_HOUSE_MODULE, OPEN_HOUSE_LEADS_PAGE, a) ||
          canAction(OPEN_HOUSE_MODULE, OPEN_HOUSE_RSVP_PAGE, a),
      ));
  return useQuery({
    queryKey: [KEY, "events", "options"],
    queryFn: () => openHouseEventsService.options(),
    enabled,
    retry: retrySkipAuth,
  });
}

export function useOpenHouseLeadsList(params: OpenHouseEventLeadQueryParams) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["open-house-leads:list"]);
  return useQuery({
    queryKey: [KEY, "leads", "list", params],
    queryFn: () => openHouseEventLeadsService.list(params),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** Events and leads share counts (lead totals per event), so refresh the whole module. */
export function useOpenHouseRsvpsList(params: OpenHouseRsvpQueryParams) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["open-house-rsvps:list"]);
  return useQuery({
    queryKey: [KEY, "rsvps", "list", params],
    queryFn: () => openHouseRsvpsService.list(params),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useInvalidateOpenHouse() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}
