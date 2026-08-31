"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantsService, type TenantQueryParams } from "@/services/tenants/tenants.service";
import { retrySkipAuth } from "@/lib/query-gate";
import type { TenantFormOutput, TenantFormValues } from "@/schemas/tenant.schema";

const KEY = "tenants";
const OWNERS_KEY = "owners";

/** Paginated list of all tenants visible to the current user. */
export function useTenantsList(params: TenantQueryParams = {}) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => tenantsService.list(params),
    retry: retrySkipAuth,
  });
}

/**
 * Tenant record for a specific lead.
 * Returns null when no tenant record exists yet (first-time form fill).
 */
export function useTenantByLeadId(leadId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "by-lead", leadId],
    queryFn: () => tenantsService.getByLeadId(leadId as string),
    enabled: !!leadId,
    retry: retrySkipAuth,
  });
}

/** Mutations for a specific lead's tenant record. */
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

  const uploadAgreement = useMutation({
    mutationFn: (file: File) => tenantsService.uploadAgreement(leadId, file),
    onSuccess: invalidate,
  });

  const deleteAgreement = useMutation({
    mutationFn: () => tenantsService.deleteAgreement(leadId),
    onSuccess: invalidate,
  });

  return {
    upsert,
    uploadPassport,
    deletePassport,
    uploadEmiratesId,
    deleteEmiratesId,
    uploadAgreement,
    deleteAgreement,
  };
}

/**
 * Standalone mutations for creating a tenant from an owner's manual property
 * and ending a tenant contract early. These invalidate both the tenants and
 * owners query caches so the Owner Details page reflects the updated
 * property status (rented ↔ available) immediately.
 */
export function useTenantPropertyMutations() {
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: [OWNERS_KEY] });
  };

  const createFromProperty = useMutation({
    mutationFn: (body: TenantFormValues & { ownerId: string; ownerManualPropertyId: string }) =>
      tenantsService.createFromProperty(body),
    onSuccess: invalidateAll,
  });

  const endContract = useMutation({
    mutationFn: ({ leadId, actualEndDate }: { leadId: string; actualEndDate: string }) =>
      tenantsService.endContract(leadId, actualEndDate),
    onSuccess: invalidateAll,
  });

  return { createFromProperty, endContract };
}
