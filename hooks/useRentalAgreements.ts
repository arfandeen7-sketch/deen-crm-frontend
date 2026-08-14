"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentalAgreementsService, type RentalAgreementQueryParams } from "@/services/rentalAgreements/rentalAgreements.service";
import { retrySkipAuth } from "@/lib/query-gate";
import type { RentalAgreementFormValues } from "@/schemas/rentalAgreement.schema";

const KEY = "rental-agreements";

export function useRentalAgreementsList(params: RentalAgreementQueryParams = {}) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => rentalAgreementsService.list(params),
    retry: retrySkipAuth,
  });
}

export function useRentalAgreementByLeadId(leadId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "by-lead", leadId],
    queryFn: () => rentalAgreementsService.getByLeadId(leadId as string),
    enabled: !!leadId,
    retry: retrySkipAuth,
  });
}

export function useRentalAgreementMutations(leadId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY, "by-lead", leadId] });
    qc.invalidateQueries({ queryKey: [KEY, "list"] });
  };

  const upsert = useMutation({
    mutationFn: (body: Partial<RentalAgreementFormValues>) =>
      rentalAgreementsService.upsert(leadId, body),
    onSuccess: invalidate,
  });

  return { upsert };
}
