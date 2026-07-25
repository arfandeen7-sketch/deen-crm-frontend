"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { integrationsService } from "@/services/integrations/integrations.service";
import { POLL_SLOW } from "@/constants";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { QUERY_REQUIREMENTS } from "@/lib/auth-manifest";

const KEY = "integrations";

export function useProviders() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["integrations:list"]);
  return useQuery({
    queryKey: [KEY, "providers"],
    queryFn: () => integrationsService.getProviders(),
    enabled,
    staleTime: 10 * 60_000,
    retry: retrySkipAuth,
  });
}

export function useIntegrationsList() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["integrations:list"]);
  return useQuery({
    queryKey: [KEY, "list"],
    queryFn: () => integrationsService.list(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useIntegration(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["integrations:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => integrationsService.get(id as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useHealthReport(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["integrations:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "health-report", id],
    queryFn: () => integrationsService.healthReport(id as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useSyncJobs(id: string | undefined) {
  const hasPermission = useQueryEnabled(QUERY_REQUIREMENTS["integrations:detail"]);
  const enabled = !!id && hasPermission;
  return useQuery({
    queryKey: [KEY, "sync-jobs", id],
    queryFn: () => integrationsService.syncJobs(id as string),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useIntegrationsDashboard() {
  const enabled = useQueryEnabled(QUERY_REQUIREMENTS["integrations:dashboard"]);
  return useQuery({
    queryKey: [KEY, "dashboard"],
    queryFn: () => integrationsService.dashboard(),
    enabled,
    refetchInterval: enabled ? POLL_SLOW : false,
    retry: retrySkipAuth,
  });
}

export function useIntegrationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] });

  const connect = useMutation({
    mutationFn: ({ provider, returnUrl }: { provider: string; returnUrl?: string }) =>
      integrationsService.connect(provider, returnUrl),
  });

  const discoverAccounts = useMutation({
    mutationFn: (id: string) => integrationsService.discoverAccounts(id),
    onSuccess: invalidate,
  });

  const selectAccounts = useMutation({
    mutationFn: ({ id, accountIds }: { id: string; accountIds: string[] }) =>
      integrationsService.selectAccounts(id, accountIds),
    onSuccess: invalidate,
  });

  const discoverForms = useMutation({
    mutationFn: ({ id, connectedAccountId }: { id: string; connectedAccountId: string }) =>
      integrationsService.discoverForms(id, connectedAccountId),
    onSuccess: invalidate,
  });

  const triggerSync = useMutation({
    mutationFn: (id: string) => integrationsService.triggerSync(id),
    onSuccess: invalidate,
  });

  const replayWebhookEvent = useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) =>
      integrationsService.replayWebhookEvent(id, eventId),
    onSuccess: invalidate,
  });

  const disconnect = useMutation({
    mutationFn: (id: string) => integrationsService.disconnect(id),
    onSuccess: invalidate,
  });

  return {
    connect,
    discoverAccounts,
    selectAccounts,
    discoverForms,
    triggerSync,
    replayWebhookEvent,
    disconnect,
  };
}
