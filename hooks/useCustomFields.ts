"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFieldsService } from "@/services/custom-fields/customFields.service";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

const KEY = ["custom-fields"] as const;

export function useLeadCustomFields() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["custom-fields:list"]);
  return useQuery({
    queryKey: [...KEY, "lead"],
    queryFn: () => customFieldsService.list("lead"),
    enabled,
    staleTime: 5 * 60_000,
    retry: retrySkipAuth,
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => customFieldsService.create(label),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
