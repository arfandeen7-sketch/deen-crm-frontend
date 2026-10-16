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

export function useLeadOptions(enabled = true) {
  const permitted = useQueryEnabled(QUERY_REQUIREMENTS["leads:list"]);
  return useQuery({
    queryKey: [KEY, "options"],
    queryFn: () => leadsService.options(),
    enabled: enabled && permitted,
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
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["properties"] });
    qc.invalidateQueries({ queryKey: ["owners"] });
    qc.invalidateQueries({ queryKey: ["deal-closed"] });
  };

  const create = useMutation({
    mutationFn: (body: LeadInput) => leadsService.create(body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      body,
      confirmReassign,
    }: {
      id: string;
      body: LeadInput;
      confirmReassign?: boolean;
    }) => leadsService.update(id, body, { confirmReassign }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => leadsService.remove(id),
    onSuccess: invalidate,
  });

  const bulkAssign = useMutation({
    mutationFn: ({
      ids,
      assignedTo,
      confirmReassign,
    }: {
      ids: string[];
      assignedTo: string;
      confirmReassign?: boolean;
    }) => leadsService.bulkAssign(ids, assignedTo, confirmReassign),
    onSuccess: invalidate,
  });

  const bulkStatus = useMutation({
    mutationFn: ({ ids, leadStatus }: { ids: string[]; leadStatus: string }) =>
      leadsService.bulkStatus(ids, leadStatus),
    onSuccess: invalidate,
  });

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => leadsService.bulkDelete(ids),
    onSuccess: invalidate,
  });

  const bulkUpdate = useMutation({
    mutationFn: ({
      ids,
      field,
      value,
    }: {
      ids: string[];
      field: string;
      value: string | null;
    }) => leadsService.bulkUpdate(ids, field, value),
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

  const convertToOwner = useMutation({
    mutationFn: (leadId: string) => leadsService.convertToOwner(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["owners"] });
      qc.invalidateQueries({ queryKey: ["deal-closed"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { create, update, remove, bulkAssign, bulkStatus, bulkDelete, bulkUpdate, importLeads, parseImport, convertToOwner };
}
