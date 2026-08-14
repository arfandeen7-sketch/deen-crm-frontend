"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantsService, type TenantQueryParams } from "@/services/tenants/tenants.service";
import { retrySkipAuth } from "@/lib/query-gate";
import type { TenantFormOutput } from "@/schemas/tenant.schema";

const KEY = "tenants";

export function useTenantsList(params: TenantQueryParams = {}) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => tenantsService.list(params),
    retry: retrySkipAuth,
  });
}

export function useTenantByLeadId(leadId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "by-lead", leadId],
    queryFn: () => tenantsService.getByLeadId(leadId as string),
    enabled: !!leadId,
    retry: retrySkipAuth,
  });
}

export function useTenantMutations(leadId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, "by-lead", leadId] });
    qc.invalidateQueries({ queryKey: [KEY, "list"] });
  };

  const upsert = useMutation({
    mutationFn: (body: Partial<TenantFormOutput>) =>
      tenantsService.upsert(leadId, body),
    onSuccess: invalidate,
  });

  const uploadPassport = useMutation({
    mutationFn: (file: File) => tenantsService.uploadPassport(leadId, file),
    onSuccess: invalidate,
  });

  const deletePassport = useMutation({
    mutationFn: () => tenantsService.deletePassport(leadId),
    onSuccess: invalidate,
  });

  const uploadEmiratesId = useMutation({
    mutationFn: (file: File) => tenantsService.uploadEmiratesId(leadId, file),
    onSuccess: invalidate,
  });

  const deleteEmiratesId = useMutation({
    mutationFn: () => tenantsService.deleteEmiratesId(leadId),
    onSuccess: invalidate,
  });

  return { upsert, uploadPassport, deletePassport, uploadEmiratesId, deleteEmiratesId };
}
