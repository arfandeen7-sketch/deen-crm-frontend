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

const KEY = "brokers";

export function useBrokersList(params: BrokerQuery) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => brokersService.list(params),
    refetchInterval: POLL_SLOW,
  });
}

export function useBroker(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => brokersService.get(id as string),
    enabled: !!id,
    refetchInterval: POLL_SLOW,
  });
}

export function useBrokerLeads(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "leads", id],
    queryFn: () => brokersService.leads(id as string),
    enabled: !!id,
    refetchInterval: POLL_FAST,
  });
}

/** All brokers as lightweight options for dropdowns. */
export function useBrokerOptions(): Broker[] {
  const { data } = useQuery({
    queryKey: [KEY, "options"],
    queryFn: () => brokersService.list({ page: 1, pageSize: 100 }),
    staleTime: 5 * 60_000,
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
