"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  usersService,
  type AssignableUser,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/services/users/users.service";
import { teamsService } from "@/services/teams/teams.service";
import { useAuth } from "@/hooks/useAuth";
import { POLL_SLOW } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

/** Full users list with role counts. */
export function useUsers() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["users:list"]);
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

/** Lightweight list of assignable users for dropdowns. */
export function useAssignableUsers() {
  const { role, user, canAction } = useAuth();
  // Whether the user needs the assignable-users list at all (i.e. they can
  // assign leads). Sales executives typically cannot, so the hook stays idle.
  const canAssignLeads = canAction("leads", "all_leads", "assign");
  // The backend `GET /api/users/assignable` route is gated on
  // `users:all_users:view`. Sales managers only have `users:teams:view`, so
  // calling that endpoint would return 403 — which the global axios 403
  // interceptor turns into a redirect away from the page (e.g. /leads →
  // /dashboard/overview). Only fire the remote query when the user actually
  // has permission to list all users; otherwise rely on the team fallback.
  const canListAllUsers = canAction("users", "all_users", "view");
  const remoteEnabled = canAssignLeads && canListAllUsers;

  const query = useQuery<AssignableUser[]>({
    queryKey: ["users", "assignable"],
    queryFn: () => usersService.assignable(),
    enabled: remoteEnabled,
    retry: (failCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) return false;
      return failCount < 2;
    },
  });

  // For sales managers, fetch team members via /teams/my-team as a fallback
  // when /users/assignable is not permitted (or returns an empty list).
  // /teams/my-team is gated on `users:teams:view`, which sales managers have.
  const teamQuery = useQuery({
    queryKey: ["teams", "my-team"],
    queryFn: () => teamsService.getMyTeam(),
    enabled: canAssignLeads && role === "sales_manager",
  });

  const fallbackUsers = useMemo<AssignableUser[]>(() => {
    if (!canAssignLeads || !user) return [];
    const unique = new Map<string, AssignableUser>();

    // Always include the current user (manager sees themselves)
    unique.set(user.id, {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    });

    if (role === "sales_manager") {
      // Merge teamMembers from auth store user (if present)
      (user.teamMembers ?? []).forEach((member) => {
        unique.set(member.id, {
          id: member.id,
          fullName: member.fullName,
          role: member.role,
        });
      });

      // Merge team members from /teams/my-team response
      (teamQuery.data?.teamMembers ?? []).forEach((member) => {
        unique.set(member.id, {
          id: member.id,
          fullName: member.fullName,
          role: member.role,
        });
      });
    }

    return Array.from(unique.values());
  }, [canAssignLeads, role, user, teamQuery.data]);

  const hasRemoteData = Array.isArray(query.data) && query.data.length > 0;
  const users = hasRemoteData ? (query.data as AssignableUser[]) : fallbackUsers;

  return {
    ...query,
    users,
  };
}

export function useUser(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["users:detail"]);
  return useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => usersService.get(id as string),
    enabled: !!id && hasPermission,
    refetchInterval: hasPermission ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const create = useMutation({
    mutationFn: (body: CreateUserInput) => usersService.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserInput }) =>
      usersService.update(id, body),
    onSuccess: invalidate,
  });
  const toggleActive = useMutation({
    mutationFn: (id: string) => usersService.toggleActive(id),
    onSuccess: invalidate,
  });

  return { create, update, toggleActive };
}
