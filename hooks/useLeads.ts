"use client";

import { useEffect, useRef } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { leadsService, type LeadInput } from "@/services/leads/leads.service";
import type { ImportMapping, LeadQueryParams } from "@/types";
import { POLL_FAST } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

const KEY = "leads";

export function useLeadsList(params: LeadQueryParams) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["leads:list"]);
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => leadsService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

export function useLead(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["leads:detail"]);
  const enabled = !!id && hasPermission;
  const query = useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => leadsService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
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

export function useLeadOptions() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["leads:list"]);
  return useQuery({
    queryKey: [KEY, "options"],
    queryFn: () => leadsService.options(),
    enabled,
    staleTime: 5 * 60_000,
    retry: retrySkipAuth,
  });
}

export function useLeadMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["followup"] });
    qc.invalidateQueries({ queryKey: ["followup-history"] });
    qc.invalidateQueries({ queryKey: ["lead-activity"] });
    qc.invalidateQueries({ queryKey: ["custom-fields"] });
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
    mutationFn: ({ file, mapping }: { file: File; mapping?: ImportMapping }) =>
      leadsService.import(file, mapping),
    onSuccess: invalidate,
  });

  const parseImport = useMutation({
    mutationFn: (file: File) => leadsService.parseImport(file),
  });

  return { create, update, remove, bulkAssign, bulkStatus, importLeads, parseImport };
}
