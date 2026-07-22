"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Share2,
  Search,
  Plug,
  Activity,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import {
  useProviders,
  useIntegrationsList,
  useIntegrationMutations,
} from "@/hooks/useIntegrations";
import { getErrorMessage } from "@/services/api/client";
import {
  INTEGRATION_STATUS_COLORS,
} from "@/constants";
import { humanize, timeAgo } from "@/lib/utils";
import type { IntegrationProviderInfo } from "@/types";

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Facebook: Share2,
  Search,
};

function HealthDot({ status }: { status: string }) {
  const color =
    status === "healthy"
      ? "bg-emerald-500"
      : status === "degraded"
        ? "bg-amber-500"
        : status === "down"
          ? "bg-rose-500"
          : "bg-slate-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={INTEGRATION_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}>
      {humanize(status)}
    </Badge>
  );
}

function IntegrationCard({
  integration,
  onDisconnect,
  disconnectingId,
}: {
  integration: { id: string; provider: string; status: string; displayName: string; healthStatus: string; lastHealthCheckAt?: string | null; createdAt: string };
  onDisconnect: (id: string) => void;
  disconnectingId: string | null;
}) {
  const Icon = PROVIDER_ICONS[integration.provider] ?? Plug;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4 first:border-t-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-section">
          <Icon className="h-5 w-5 text-foreground-secondary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{integration.displayName}</p>
            <StatusBadge status={integration.status} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-foreground-muted">
            <span className="flex items-center gap-1">
              <HealthDot status={integration.healthStatus} />
              {humanize(integration.healthStatus)}
            </span>
            <span>Last check: {timeAgo(integration.lastHealthCheckAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/integrations/${integration.id}`}
          className="rounded p-1.5 text-foreground-muted hover:bg-panel hover:text-foreground"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Link>
        <CanAccess module="integrations" page="all_integrations" action="health">
          <Link
            href={`/integrations/${integration.id}?tab=health`}
            className="rounded p-1.5 text-foreground-muted hover:bg-panel hover:text-foreground"
            title="Health Report"
          >
            <Activity className="h-4 w-4" />
          </Link>
        </CanAccess>
        <CanAccess module="integrations" page="all_integrations" action="disconnect">
          <button
            onClick={() => onDisconnect(integration.id)}
            disabled={disconnectingId === integration.id}
            className="rounded p-1.5 text-foreground-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Disconnect"
          >
            {disconnectingId === integration.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </CanAccess>
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  integrations,
  onConnect,
  connectingProvider,
  onDisconnect,
  disconnectingId,
}: {
  provider: IntegrationProviderInfo;
  integrations: { id: string; provider: string; status: string; displayName: string; healthStatus: string; lastHealthCheckAt?: string | null; createdAt: string }[];
  onConnect: (providerKey: string) => void;
  connectingProvider: string | null;
  onDisconnect: (id: string) => void;
  disconnectingId: string | null;
}) {
  const Icon = PROVIDER_ICONS[provider.icon] ?? Plug;
  const providerIntegrations = integrations.filter((i) => i.provider === provider.key);

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-section">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{provider.label}</h3>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {providerIntegrations.length > 0
                ? `${providerIntegrations.length} connection${providerIntegrations.length > 1 ? "s" : ""}`
                : "Not connected"}
            </p>
          </div>
        </div>
        <CanAccess module="integrations" page="all_integrations" action="connect">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConnect(provider.key)}
            loading={connectingProvider === provider.key}
          >
            <Plug className="h-4 w-4" /> Connect
          </Button>
        </CanAccess>
      </div>
      {providerIntegrations.length > 0 && (
        <div className="border-t border-border">
          {providerIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onDisconnect={onDisconnect}
              disconnectingId={disconnectingId}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: providersData, isLoading: providersLoading } = useProviders();
  const { data: integrationsData, isLoading: integrationsLoading, isError, refetch } = useIntegrationsList();
  const mutations = useIntegrationMutations();

  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  const providers = providersData?.providers ?? [];
  const integrations = integrationsData?.integrations ?? [];

  // Handle OAuth callback redirect: ?integration=<id>&status=connected
  useEffect(() => {
    const status = searchParams.get("status");
    const integrationId = searchParams.get("integration");
    if (status && integrationId) {
      if (status === "connected") {
        toast.success("Integration connected successfully");
        router.replace(`/integrations/${integrationId}`);
      } else {
        toast.error("Failed to connect integration. Please try again.");
        router.replace("/integrations");
      }
    }
  }, [searchParams, router]);

  async function handleConnect(providerKey: string) {
    setConnectingProvider(providerKey);
    try {
      const returnUrl = `${window.location.origin}/integrations`;
      const res = await mutations.connect.mutateAsync({ provider: providerKey, returnUrl });
      window.location.href = res.authorizationUrl;
    } catch (e) {
      toast.error(getErrorMessage(e));
      setConnectingProvider(null);
    }
  }

  async function handleDisconnect() {
    if (!disconnectId) return;
    try {
      await mutations.disconnect.mutateAsync(disconnectId);
      toast.success("Integration disconnected");
      setDisconnectId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (providersLoading || integrationsLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Integrations" subtitle="Connect lead sources via OAuth" />
        <LoadingState label="Loading integrations…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Integrations" subtitle="Connect lead sources via OAuth" />
        <ErrorState message="Failed to load integrations" onRetry={refetch} />
      </div>
    );
  }

  return (
    <AccessGuard module="integrations" page="all_integrations">
      <div className="space-y-5">
        <PageHeader
          title="Integrations"
          subtitle="Connect Meta (Facebook/Instagram) and Google Ads to ingest leads automatically"
          actions={
            <CanAccess module="integrations" page="all_integrations" action="health">
              <Link href="/integrations/dashboard">
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4" /> Dashboard
                </Button>
              </Link>
            </CanAccess>
          }
        />

        {providers.length === 0 && integrations.length === 0 ? (
          <EmptyState
            title="No integrations available"
            message="No integration providers are configured on the backend."
            icon={<Plug className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.key}
                provider={provider}
                integrations={integrations}
                onConnect={handleConnect}
                connectingProvider={connectingProvider}
                onDisconnect={(id) => setDisconnectId(id)}
                disconnectingId={disconnectId}
              />
            ))}
          </div>
        )}

        <ConfirmModal
          open={!!disconnectId}
          onClose={() => setDisconnectId(null)}
          onConfirm={handleDisconnect}
          title="Disconnect integration?"
          message="This will disconnect the integration and stop lead ingestion. You can reconnect later."
          confirmLabel="Disconnect"
          loading={mutations.disconnect.isPending}
        />
      </div>
    </AccessGuard>
  );
}
