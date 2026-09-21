"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pocketListingsService } from "@/services/pocketListings/pocketListings.service";
import type { PocketListingQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

const KEY = "pocket-listings";

export function usePocketListingsList(params: PocketListingQueryParams) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["pocket-listings:list"]);
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => pocketListingsService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function usePocketListing(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["pocket-listings:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => pocketListingsService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useAvailablePocketListings(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["pocket-listings:list"]);
  return useQuery({
    queryKey: [KEY, "available", params],
    queryFn: () => pocketListingsService.available(params),
    enabled,
    retry: retrySkipAuth,
  });
}

export function usePocketListingMutations() {
  const qc = useQueryClient();
  const invalidate = (id?: string) => {
    qc.invalidateQueries({ queryKey: [KEY] });
    if (id) qc.invalidateQueries({ queryKey: [KEY, "detail", id] });
  };

  const create = useMutation({
    mutationFn: (formData: FormData) => pocketListingsService.create(formData),
    onSuccess: () => invalidate(),
  });

  const update = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      pocketListingsService.update(id, formData),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const removeImage = useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) =>
      pocketListingsService.removeImage(id, imageId),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const remove = useMutation({
    mutationFn: (id: string) => pocketListingsService.remove(id),
    onSuccess: () => invalidate(),
  });

  return { create, update, removeImage, remove };
}

// ── Owner Document Mutations ──────────────────────────────────────────────────

export function usePocketListingOwnerDocMutations() {
  const qc = useQueryClient();
  const invalidate = (id: string) => {
    qc.invalidateQueries({ queryKey: [KEY, "detail", id] });
  };

  const uploadOwnerPassport = useMutation({
    mutationFn: ({ id, file, ownerPassportStartDate, ownerPassportEndDate }: {
      id: string;
      file: File;
      ownerPassportStartDate?: string;
      ownerPassportEndDate?: string;
    }) =>
      pocketListingsService.uploadOwnerPassport(id, file, {
        ownerPassportStartDate,
        ownerPassportEndDate,
      }),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const removeOwnerPassport = useMutation({
    mutationFn: (id: string) => pocketListingsService.removeOwnerPassport(id),
    onSuccess: (_d, id) => invalidate(id),
  });

  const uploadOwnerEmiratesId = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      pocketListingsService.uploadOwnerEmiratesId(id, file),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const removeOwnerEmiratesId = useMutation({
    mutationFn: (id: string) => pocketListingsService.removeOwnerEmiratesId(id),
    onSuccess: (_d, id) => invalidate(id),
  });

  const uploadOwnerDoc = useMutation({
    mutationFn: ({ id, file, type, label }: {
      id: string;
      file: File;
      type: string;
      label?: string;
    }) => pocketListingsService.uploadOwnerDoc(id, file, { type, label }),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const removeOwnerDoc = useMutation({
    mutationFn: ({ id, docId }: { id: string; docId: string }) =>
      pocketListingsService.removeOwnerDoc(id, docId),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  return {
    uploadOwnerPassport,
    removeOwnerPassport,
    uploadOwnerEmiratesId,
    removeOwnerEmiratesId,
    uploadOwnerDoc,
    removeOwnerDoc,
  };
}
