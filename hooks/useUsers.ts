"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  usersService,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/services/users/users.service";
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

/** Lightweight list of assignable users for dropdowns. */
export function useAssignableUsers() {
  const { role } = useAuth();
  const enabled = can(role, "leads.assign");
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.list(),
    enabled,
  });
  return {
    ...query,
    users: query.data?.users ?? [],
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
