"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsService, type ClientQueryParams } from "@/services/clients/clients.service";
import { retrySkipAuth } from "@/lib/query-gate";
import type { ClientFormOutput } from "@/schemas/client.schema";

const KEY = "clients";

/** Paginated list of all clients visible to the current user. */
export function useClientsList(params: ClientQueryParams = {}) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => clientsService.list(params),
    retry: retrySkipAuth,
  });
}

/**
 * Client record for a specific lead.
 * Returns null when no client record exists yet (first-time form fill).
 */
export function useClientByLeadId(leadId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "by-lead", leadId],
    queryFn: () => clientsService.getByLeadId(leadId as string),
    enabled: !!leadId,
    retry: retrySkipAuth,
  });
}

/** Mutations for a specific lead's client record. */
export function useClientMutations(leadId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, "by-lead", leadId] });
    qc.invalidateQueries({ queryKey: [KEY, "list"] });
  };

  const upsert = useMutation({
    mutationFn: (body: Partial<ClientFormOutput>) =>
      clientsService.upsert(leadId, body),
    onSuccess: invalidate,
  });

  const uploadPassport = useMutation({
    mutationFn: (file: File) => clientsService.uploadPassport(leadId, file),
    onSuccess: invalidate,
  });

  const deletePassport = useMutation({
    mutationFn: () => clientsService.deletePassport(leadId),
    onSuccess: invalidate,
  });

  const uploadEmiratesId = useMutation({
    mutationFn: (file: File) => clientsService.uploadEmiratesId(leadId, file),
    onSuccess: invalidate,
  });

  const deleteEmiratesId = useMutation({
    mutationFn: () => clientsService.deleteEmiratesId(leadId),
    onSuccess: invalidate,
  });

  return { upsert, uploadPassport, deletePassport, uploadEmiratesId, deleteEmiratesId };
}
