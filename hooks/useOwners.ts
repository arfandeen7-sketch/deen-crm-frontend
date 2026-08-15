"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ownersService,
  type OwnerCreateResult,
} from "@/services/owners/owners.service";
import type { OwnerInput, OwnerPropertyInput, OwnerQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

const KEY = "owners";

export function useOwnersList(params: OwnerQueryParams) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["owners:list"]);
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => ownersService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useOwner(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["owners:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => ownersService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useOwnerLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mobile: string) => ownersService.lookup(mobile),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useAvailableProperties(params: {
  page?: number;
  perPage?: number;
  search?: string;
}) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["owners:list"]);
  return useQuery({
    queryKey: [KEY, "available-properties", params],
    queryFn: () => ownersService.availableProperties(params),
    enabled,
    retry: retrySkipAuth,
  });
}

export function useOwnerMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY] });
  };

  const create = useMutation({
    mutationFn: (body: OwnerInput) => ownersService.create(body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: OwnerInput }) =>
      ownersService.update(id, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => ownersService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export function useOwnerPropertyMutations() {
  const qc = useQueryClient();
  const invalidate = (ownerId?: string) => {
    qc.invalidateQueries({ queryKey: [KEY] });
    if (ownerId) {
      qc.invalidateQueries({ queryKey: [KEY, "detail", ownerId] });
    }
  };

  const createProperty = useMutation({
    mutationFn: ({
      ownerId,
      body,
    }: {
      ownerId: string;
      body: OwnerPropertyInput;
    }) => ownersService.createProperty(ownerId, body),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const updateProperty = useMutation({
    mutationFn: ({
      ownerId,
      propertyId,
      body,
    }: {
      ownerId: string;
      propertyId: string;
      body: OwnerPropertyInput;
    }) => ownersService.updateProperty(ownerId, propertyId, body),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const removeProperty = useMutation({
    mutationFn: ({
      ownerId,
      propertyId,
    }: {
      ownerId: string;
      propertyId: string;
    }) => ownersService.removeProperty(ownerId, propertyId),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  return { createProperty, updateProperty, removeProperty };
}

export type { OwnerCreateResult };
