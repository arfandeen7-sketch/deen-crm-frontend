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
import { can } from "@/lib/rbac";

/** Full users list with role counts (master only). */
export function useUsers() {
  const { role } = useAuth();
  return useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
    enabled: can(role, "users.manage"),
  });
}

/** Lightweight list of assignable users for dropdowns — uses /users/assignable, accessible to master + sales_manager. */
export function useAssignableUsers() {
  const { role, user } = useAuth();
  const enabled = can(role, "leads.assign");
  const query = useQuery<AssignableUser[]>({
    queryKey: ["users", "assignable"],
    queryFn: () => usersService.assignable(),
    enabled,
    retry: (failCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) return false;
      return failCount < 2;
    },
  });

  // For sales managers, fetch team members via /teams/my-team as a fallback
  // when /users/assignable returns an empty list (e.g. backend bug or missing data).
  const teamQuery = useQuery({
    queryKey: ["teams", "my-team"],
    queryFn: () => teamsService.getMyTeam(),
    enabled: enabled && role === "sales_manager",
  });

  const fallbackUsers = useMemo<AssignableUser[]>(() => {
    if (!enabled || !user) return [];
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
  }, [enabled, role, user, teamQuery.data]);

  const hasRemoteData = Array.isArray(query.data) && query.data.length > 0;
  const users = hasRemoteData ? (query.data as AssignableUser[]) : fallbackUsers;

  return {
    ...query,
    users,
  };
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => usersService.get(id as string),
    enabled: !!id,
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
