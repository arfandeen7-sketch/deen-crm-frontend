"use client";

import { useEffect, useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { leadsService, type LeadInput } from "@/services/leads/leads.service";
import type { LeadQueryParams } from "@/types";

const KEY = "leads";

export function useLeadsList(params: LeadQueryParams) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => leadsService.list(params),
  });
}

export function useLead(id: string | undefined) {
  const query = useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => leadsService.get(id as string),
    enabled: !!id,
  });

  // Viewing a lead's detail page marks it as touched server-side (see backend
  // GET /api/leads/:id). Invalidate list-derived caches once per lead per
  // mount so the lead disappears from the Untouched Leads module immediately
  // without waiting for the default query staleTime to elapse.
  const qc = useQueryClient();
  const invalidatedForId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (query.data && invalidatedForId.current !== id) {
      invalidatedForId.current = id;
      qc.invalidateQueries({ queryKey: [KEY, "list"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["followup"] });
    }
  }, [query.data, id, qc]);

  return query;
}

export function useLeadMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["followup"] });
  };

  const create = useMutation({
    mutationFn: (body: LeadInput) => leadsService.create(body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: LeadInput }) =>
      leadsService.update(id, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => leadsService.remove(id),
    onSuccess: invalidate,
  });

  const bulkAssign = useMutation({
    mutationFn: ({ ids, assignedTo }: { ids: string[]; assignedTo: string }) =>
      leadsService.bulkAssign(ids, assignedTo),
    onSuccess: invalidate,
  });

  const bulkStatus = useMutation({
    mutationFn: ({ ids, leadStatus }: { ids: string[]; leadStatus: string }) =>
      leadsService.bulkStatus(ids, leadStatus),
    onSuccess: invalidate,
  });

  const importLeads = useMutation({
    mutationFn: (file: File) => leadsService.import(file),
    onSuccess: invalidate,
  });

  return { create, update, remove, bulkAssign, bulkStatus, importLeads };
}
