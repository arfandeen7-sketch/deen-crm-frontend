"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsService } from "@/services/teams/teams.service";
import { useAuth } from "@/hooks/useAuth";
import type {
  AssignTeamPayload,
  ReassignExecutivePayload,
  UnassignExecutivePayload,
} from "@/types";

export function useAllTeams() {
  const { role } = useAuth();
  return useQuery({
    queryKey: ["teams", "all"],
    queryFn: () => teamsService.getAllTeams(),
    enabled: role === "master",
  });
}

export function useMyTeam() {
  const { role } = useAuth();
  return useQuery({
    queryKey: ["teams", "my-team"],
    queryFn: () => teamsService.getMyTeam(),
    enabled: role === "sales_manager",
  });
}

export function useTeamMembers(managerId: string | undefined) {
  return useQuery({
    queryKey: ["teams", "members", managerId],
    queryFn: () => teamsService.getTeamMembers(managerId as string),
    enabled: !!managerId,
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
