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
import { ownerManualPropertiesService } from "@/services/owners/ownerManualProperties.service";
import type { OwnerInput, OwnerPropertyInput, OwnerQueryParams, ManualPropertyInput } from "@/types";
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

// ── Manual Property Hooks ─────────────────────────────────────────────────────

export function useOwnerManualProperties(ownerId: string | undefined) {
  const enabled = !!ownerId;
  return useQuery({
    queryKey: [KEY, "manual-properties", ownerId],
    queryFn: () => ownerManualPropertiesService.list(ownerId as string),
    enabled,
    retry: retrySkipAuth,
  });
}

export function useOwnerManualPropertyMutations() {
  const qc = useQueryClient();
  const invalidate = (ownerId?: string) => {
    qc.invalidateQueries({ queryKey: [KEY] });
    if (ownerId) {
      qc.invalidateQueries({ queryKey: [KEY, "manual-properties", ownerId] });
      qc.invalidateQueries({ queryKey: [KEY, "detail", ownerId] });
    }
  };

  const create = useMutation({
    mutationFn: ({ ownerId, body }: { ownerId: string; body: ManualPropertyInput }) =>
      ownerManualPropertiesService.create(ownerId, body),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const update = useMutation({
    mutationFn: ({ ownerId, propId, body }: { ownerId: string; propId: string; body: ManualPropertyInput }) =>
      ownerManualPropertiesService.update(ownerId, propId, body),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const remove = useMutation({
    mutationFn: ({ ownerId, propId }: { ownerId: string; propId: string }) =>
      ownerManualPropertiesService.remove(ownerId, propId),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const addImages = useMutation({
    mutationFn: ({ ownerId, propId, files }: { ownerId: string; propId: string; files: File[] }) =>
      ownerManualPropertiesService.addImages(ownerId, propId, files),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const removeImage = useMutation({
    mutationFn: ({ ownerId, propId, imageId }: { ownerId: string; propId: string; imageId: string }) =>
      ownerManualPropertiesService.removeImage(ownerId, propId, imageId),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  return { create, update, remove, addImages, removeImage };
}

// ── Owner Document Hooks ──────────────────────────────────────────────────────

export function useOwnerDocumentMutations() {
  const qc = useQueryClient();
  const invalidate = (ownerId: string) => {
    qc.invalidateQueries({ queryKey: [KEY, "detail", ownerId] });
  };

  const uploadPassport = useMutation({
    mutationFn: ({ ownerId, file }: { ownerId: string; file: File }) =>
      ownerManualPropertiesService.uploadPassport(ownerId, file),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const removePassport = useMutation({
    mutationFn: (ownerId: string) => ownerManualPropertiesService.removePassport(ownerId),
    onSuccess: (_data, ownerId) => invalidate(ownerId),
  });

  const uploadEmiratesId = useMutation({
    mutationFn: ({ ownerId, file }: { ownerId: string; file: File }) =>
      ownerManualPropertiesService.uploadEmiratesId(ownerId, file),
    onSuccess: (_data, vars) => invalidate(vars.ownerId),
  });

  const removeEmiratesId = useMutation({
    mutationFn: (ownerId: string) => ownerManualPropertiesService.removeEmiratesId(ownerId),
    onSuccess: (_data, ownerId) => invalidate(ownerId),
  });

  return { uploadPassport, removePassport, uploadEmiratesId, removeEmiratesId };
}

export type { OwnerCreateResult };
