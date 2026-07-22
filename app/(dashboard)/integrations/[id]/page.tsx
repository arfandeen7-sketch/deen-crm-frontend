"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Share2, Search, Plug, Activity, Trash2, RefreshCw,
  Loader2, Eye,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import {
  useIntegration, useHealthReport, useSyncJobs, useIntegrationMutations,
} from "@/hooks/useIntegrations";
import { getErrorMessage } from "@/services/api/client";
import {
  INTEGRATION_STATUS_COLORS,
  SYNC_JOB_STATUS_COLORS, CONNECTED_ACCOUNT_TYPE_LABELS,
} from "@/constants";
import { humanize, timeAgo, formatDateTime } from "@/lib/utils";
import type { ConnectedAccount, LeadForm } from "@/types";

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meta: Share2, google: Search,
};

type Tab = "accounts" | "forms" | "health" | "sync" | "webhooks";

const TABS: { key: Tab; label: string }[] = [
  { key: "accounts", label: "Connected Accounts" },
  { key: "forms", label: "Lead Forms" },
  { key: "health", label: "Health" },
  { key: "sync", label: "Sync Jobs" },
  { key: "webhooks", label: "Webhook Events" },
];

function StatusBadge({ status }: { status: string }) {
  return <Badge className={INTEGRATION_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}>{humanize(status)}</Badge>;
}

function HealthDot({ status }: { status: string }) {
  const c = status === "healthy" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : status === "down" ? "bg-rose-500" : "bg-slate-400";
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />;
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="border border-border bg-background px-4 py-3 rounded-md">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
}

export default function IntegrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialTab = (searchParams.get("tab") as Tab) || "accounts";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const { data: integration, isLoading, isError, refetch } = useIntegration(id);
  const { data: healthReport } = useHealthReport(id);
  const { data: syncJobsData } = useSyncJobs(id);
  const mutations = useIntegrationMutations();

  const [discoveredAccounts, setDiscoveredAccounts] = useState<ConnectedAccount[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [discoveredForms, setDiscoveredForms] = useState<Record<string, LeadForm[]>>({});
  const [formsLoadingFor, setFormsLoadingFor] = useState<string | null>(null);

  if (isLoading) return <div><PageHeader title="Integration" /><LoadingState /></div>;
  if (isError) return <div><PageHeader title="Integration" /><ErrorState onRetry={refetch} /></div>;
  if (!integration) return <EmptyState title="Integration not found" />;

  const Icon = PROVIDER_ICONS[integration.provider] ?? Plug;
  const accounts = integration.connectedAccounts ?? discoveredAccounts ?? [];
  const syncJobs = syncJobsData?.jobs ?? [];

  async function handleDiscoverAccounts() {
    try {
      const res = await mutations.discoverAccounts.mutateAsync(id);
      setDiscoveredAccounts(res.accounts);
      const preSelected = new Set(res.accounts.filter(a => a.selected).map(a => a.id));
      setSelectedIds(preSelected);
      toast.success(`Found ${res.accounts.length} account(s)`);
    } catch (e) { toast.error(getErrorMessage(e)); }
  }

  async function handleSelectAccounts() {
    try {
      await mutations.selectAccounts.mutateAsync({ id, accountIds: [...selectedIds] });
      toast.success("Accounts updated");
    } catch (e) { toast.error(getErrorMessage(e)); }
  }

  function toggleAccount(accId: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(accId) ? n.delete(accId) : n.add(accId); return n; });
  }

  async function handleDiscoverForms(accId: string) {
    setFormsLoadingFor(accId);
    try {
      const res = await mutations.discoverForms.mutateAsync({ id, connectedAccountId: accId });
      setDiscoveredForms(prev => ({ ...prev, [accId]: res.forms }));
    } catch (e) { toast.error(getErrorMessage(e)); }
    setFormsLoadingFor(null);
  }

  async function handleTriggerSync() {
    try {
      await mutations.triggerSync.mutateAsync(id);
      toast.success("Sync triggered");
    } catch (e) { toast.error(getErrorMessage(e)); }
  }

  async function handleDisconnect() {
    try {
      await mutations.disconnect.mutateAsync(id);
      toast.success("Integration disconnected");
      router.push("/integrations");
    } catch (e) { toast.error(getErrorMessage(e)); }
  }

  return (
    <AccessGuard module="integrations" page="all_integrations">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-section">
              <Icon className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{integration.displayName}</h1>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={integration.status} />
                <span className="flex items-center gap-1 text-xs text-foreground-muted">
                  <HealthDot status={integration.healthStatus} /> {humanize(integration.healthStatus)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CanAccess module="integrations" page="sync_jobs" action="trigger">
              <Button variant="outline" size="sm" onClick={handleTriggerSync} loading={mutations.triggerSync.isPending}>
                <RefreshCw className="h-4 w-4" /> Sync
              </Button>
            </CanAccess>
            <CanAccess module="integrations" page="all_integrations" action="disconnect">
              <Button variant="danger" size="sm" onClick={() => setDisconnectOpen(true)}>
                <Trash2 className="h-4 w-4" /> Disconnect
              </Button>
            </CanAccess>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.key ? "border-foreground text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Accounts Tab */}
        {tab === "accounts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground-muted">Discover and select accounts for lead ingestion.</p>
              <CanAccess module="integrations" page="connected_accounts" action="discover">
                <Button variant="outline" size="sm" onClick={handleDiscoverAccounts} loading={mutations.discoverAccounts.isPending}>
                  <RefreshCw className="h-4 w-4" /> Discover Accounts
                </Button>
              </CanAccess>
            </div>
            {accounts.length === 0 ? (
              <EmptyState title="No accounts" message="Click Discover Accounts to find available pages and ad accounts." icon={<Plug className="h-6 w-6" />} />
            ) : (
              <>
                <Card>
                  <div className="divide-y divide-border">
                    {accounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <CanAccess module="integrations" page="connected_accounts" action="select">
                            <button onClick={() => toggleAccount(acc.id)}
                              className={`flex h-5 w-5 items-center justify-center rounded border ${selectedIds.has(acc.id) ? "bg-foreground border-foreground text-white" : "border-border"}`}>
                              {selectedIds.has(acc.id) && <Eye className="h-3 w-3" />}
                            </button>
                          </CanAccess>
                          <div>
                            <p className="text-sm font-medium text-foreground">{acc.name}</p>
                            <p className="text-xs text-foreground-muted">{CONNECTED_ACCOUNT_TYPE_LABELS[acc.accountType] ?? humanize(acc.accountType)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-foreground-muted">{acc.externalAccountId}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <CanAccess module="integrations" page="connected_accounts" action="select">
                  <Button size="sm" onClick={handleSelectAccounts} loading={mutations.selectAccounts.isPending}>
                    Save Selected Accounts
                  </Button>
                </CanAccess>
              </>
            )}
          </div>
        )}

        {/* Forms Tab */}
        {tab === "forms" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-muted">Discover lead forms for each selected account.</p>
            {accounts.filter(a => selectedIds.has(a.id)).length === 0 ? (
              <EmptyState title="No selected accounts" message="Select accounts in the Connected Accounts tab first." />
            ) : (
              accounts.filter(a => selectedIds.has(a.id)).map(acc => (
                <Card key={acc.id}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{acc.name}</p>
                      <p className="text-xs text-foreground-muted">{CONNECTED_ACCOUNT_TYPE_LABELS[acc.accountType] ?? humanize(acc.accountType)}</p>
                    </div>
                    <CanAccess module="integrations" page="lead_forms" action="discover">
                      <Button variant="outline" size="sm" onClick={() => handleDiscoverForms(acc.id)} loading={formsLoadingFor === acc.id}>
                        <RefreshCw className="h-4 w-4" /> Discover Forms
                      </Button>
                    </CanAccess>
                  </div>
                  {discoveredForms[acc.id] && (
                    <div className="divide-y divide-border">
                      {discoveredForms[acc.id].length === 0 ? (
                        <p className="px-6 py-4 text-sm text-foreground-muted">No forms found.</p>
                      ) : (
                        discoveredForms[acc.id].map(form => (
                          <div key={form.externalFormId} className="flex items-center justify-between px-6 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{form.name}</p>
                              <p className="text-xs text-foreground-muted">ID: {form.externalFormId}</p>
                            </div>
                            {form.metadata?.status != null && (
                              <Badge className="bg-slate-100 text-slate-600">{String(form.metadata.status)}</Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Health Tab */}
        {tab === "health" && (
          <div className="space-y-4">
            {!healthReport ? (
              <LoadingState label="Loading health report…" />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Token Status" value={<StatusBadge status={healthReport.credentialHealth.status} />} />
                  <StatCard label="Days to Expiry" value={healthReport.credentialHealth.daysUntilExpiry ?? "—"} />
                  <StatCard label="Accounts" value={healthReport.accountCount} />
                  <StatCard label="Lead Sources" value={healthReport.leadSourceCount} />
                </div>

                <Card>
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Webhook Stats</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 lg:grid-cols-6">
                    <StatCard label="Received" value={healthReport.webhookStats.received} />
                    <StatCard label="Processed" value={healthReport.webhookStats.processed} />
                    <StatCard label="Failed" value={healthReport.webhookStats.failed} />
                    <StatCard label="Duplicate" value={healthReport.webhookStats.duplicate} />
                    <StatCard label="Dead Letter" value={healthReport.webhookStats.deadLetter} />
                    <StatCard label="Oldest Pending" value={healthReport.webhookStats.oldestUnprocessedAgeMs ? `${Math.round(healthReport.webhookStats.oldestUnprocessedAgeMs / 1000)}s` : "—"} />
                  </div>
                </Card>

                <Card>
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Sync Stats</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard label="Total" value={healthReport.syncStats.total} />
                    <StatCard label="Completed" value={healthReport.syncStats.completed} />
                    <StatCard label="Failed" value={healthReport.syncStats.failed} />
                    <StatCard label="Running" value={healthReport.syncStats.running} />
                    <StatCard label="Last Completed" value={timeAgo(healthReport.syncStats.lastCompletedAt)} />
                  </div>
                </Card>

                <Card>
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Lead Stats</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-2">
                    <StatCard label="Total Ingested" value={healthReport.leadStats.totalIngested} />
                    <StatCard label="Duplicates" value={healthReport.leadStats.duplicates} />
                  </div>
                </Card>

                <Card>
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">Credential Health</h3>
                  </div>
                  <div className="p-6 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-foreground-muted">Status</span><StatusBadge status={healthReport.credentialHealth.status} /></div>
                    <div className="flex justify-between"><span className="text-foreground-muted">Last Refresh</span><span>{formatDateTime(healthReport.credentialHealth.lastRefreshAt)}</span></div>
                    <div className="flex justify-between"><span className="text-foreground-muted">Token Expires</span><span>{formatDateTime(healthReport.credentialHealth.accessTokenExpiresAt)}</span></div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Sync Jobs Tab */}
        {tab === "sync" && (
          <div className="space-y-4">
            <CanAccess module="integrations" page="sync_jobs" action="trigger">
              <Button variant="outline" size="sm" onClick={handleTriggerSync} loading={mutations.triggerSync.isPending}>
                <RefreshCw className="h-4 w-4" /> Trigger Sync
              </Button>
            </CanAccess>
            {syncJobs.length === 0 ? (
              <EmptyState title="No sync jobs" message="Sync jobs will appear here once triggered." />
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        {["Type", "Status", "Started", "Completed", "Fetched", "Created", "Duplicates", "Error"].map(h => (
                          <th key={h} className="border-b border-border bg-section px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {syncJobs.map(job => (
                        <tr key={job.id}>
                          <td className="border-b border-border px-5 py-3 text-sm text-foreground">{humanize(job.jobType)}</td>
                          <td className="border-b border-border px-5 py-3"><Badge className={SYNC_JOB_STATUS_COLORS[job.status] ?? "bg-slate-100 text-slate-600"}>{humanize(job.status)}</Badge></td>
                          <td className="border-b border-border px-5 py-3 text-sm text-foreground-muted">{formatDateTime(job.startedAt)}</td>
                          <td className="border-b border-border px-5 py-3 text-sm text-foreground-muted">{formatDateTime(job.completedAt)}</td>
                          <td className="border-b border-border px-5 py-3 text-sm">{job.result?.fetchedCount ?? "—"}</td>
                          <td className="border-b border-border px-5 py-3 text-sm">{job.result?.createdCount ?? "—"}</td>
                          <td className="border-b border-border px-5 py-3 text-sm">{job.result?.duplicateCount ?? "—"}</td>
                          <td className="border-b border-border px-5 py-3 text-sm text-rose-600 max-w-xs truncate">{job.errorMessage ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {tab === "webhooks" && (
          <EmptyState title="Webhook events" message="Webhook event replay requires backend listing support. Use the health tab to view webhook stats." icon={<Activity className="h-6 w-6" />} />
        )}

        <ConfirmModal open={disconnectOpen} onClose={() => setDisconnectOpen(false)} onConfirm={handleDisconnect}
          title="Disconnect integration?" message="This will stop lead ingestion. You can reconnect later."
          confirmLabel="Disconnect" loading={mutations.disconnect.isPending} />
      </div>
    </AccessGuard>
  );
}
