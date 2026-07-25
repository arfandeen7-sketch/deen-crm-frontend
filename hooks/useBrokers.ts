"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  brokersService,
  type BrokerInput,
  type BrokerQuery,
} from "@/services/brokers/brokers.service";
import type { Broker } from "@/types";
import { POLL_FAST, POLL_SLOW } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

const KEY = "brokers";

export function useBrokersList(params: BrokerQuery) {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["brokers:list"]);
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => brokersService.list(params),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useBroker(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["brokers:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => brokersService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useBrokerLeads(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["brokers:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "leads", id],
    queryFn: () => brokersService.leads(id as string),
    enabled,
    refetchInterval: enabled ? POLL_FAST : false,
    retry: retrySkipAuth,
  });
}

/** All brokers as lightweight options for dropdowns. */
export function useBrokerOptions(): Broker[] {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["brokers:list"]);
  const { data } = useQuery({
    queryKey: [KEY, "options"],
    queryFn: () => brokersService.list({ page: 1, pageSize: 100 }),
    enabled,
    staleTime: 5 * 60_000,
    retry: retrySkipAuth,
  });
  return data?.data ?? [];
}

export function useBrokerMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] });

  const create = useMutation({
    mutationFn: (body: BrokerInput) => brokersService.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: BrokerInput }) =>
      brokersService.update(id, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => brokersService.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
