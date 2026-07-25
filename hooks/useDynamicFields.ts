"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dynamicFieldsService,
  type DynamicFieldInput,
} from "@/services/dynamic-fields/dynamicFields.service";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

/** Fetch dynamic field values for a category (e.g. lead_status, source). */
export function useDynamicFields(category?: string) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["dynamic-fields:list"]);
  return useQuery({
    queryKey: ["dynamic-fields", category ?? "all"],
    queryFn: () => dynamicFieldsService.list(category),
    enabled,
    staleTime: 5 * 60_000,
    retry: retrySkipAuth,
  });
}

/** Returns just the string values for a category — convenient for <Select> options. */
export function useFieldOptions(category: string): string[] {
  const { data } = useDynamicFields(category);
  return (data ?? []).map((f) => f.value);
}

export function useDynamicFieldMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["dynamic-fields"] });

  const create = useMutation({
    mutationFn: (body: DynamicFieldInput) => dynamicFieldsService.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<DynamicFieldInput> }) =>
      dynamicFieldsService.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => dynamicFieldsService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
