"use client";

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
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => leadsService.get(id as string),
    enabled: !!id,
  });
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
