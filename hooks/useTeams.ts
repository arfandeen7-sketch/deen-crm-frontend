"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsService } from "@/services/teams/teams.service";
import { POLL_SLOW } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";
import type {
  AssignTeamPayload,
  ReassignExecutivePayload,
  UnassignExecutivePayload,
} from "@/types";

export function useAllTeams() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["teams:all"]);
  return useQuery({
    queryKey: ["teams", "all"],
    queryFn: () => teamsService.getAllTeams(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useMyTeam() {
  const enabled = useQueryEnabled("teams:my-team");
  return useQuery({
    queryKey: ["teams", "my-team"],
    queryFn: () => teamsService.getMyTeam(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useTeamMembers(managerId: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["teams:all"]);
  const enabled = !!managerId && hasPermission;
  return useQuery({
    queryKey: ["teams", "members", managerId],
    queryFn: () => teamsService.getTeamMembers(managerId as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useTeamMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["teams"] });
    qc.invalidateQueries({ queryKey: ["users"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const assignExecutives = useMutation({
    mutationFn: (payload: AssignTeamPayload) => teamsService.assignExecutives(payload),
    onSuccess: invalidate,
  });

  const unassignExecutive = useMutation({
    mutationFn: (payload: UnassignExecutivePayload) => teamsService.unassignExecutive(payload),
    onSuccess: invalidate,
  });

  const reassignExecutive = useMutation({
    mutationFn: (payload: ReassignExecutivePayload) => teamsService.reassignExecutive(payload),
    onSuccess: invalidate,
  });

  return { assignExecutives, unassignExecutive, reassignExecutive };
}
