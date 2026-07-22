"use client";

import Link from "next/link";
import {
  Activity, AlertTriangle, Plug, Share2, Search,
  TrendingUp, Copy, MailWarning, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { useIntegrationsDashboard } from "@/hooks/useIntegrations";
import {
  INTEGRATION_STATUS_COLORS,
} from "@/constants";
import { humanize } from "@/lib/utils";
import type { HealthReport } from "@/types";

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meta: Share2, google: Search,
};

function SummaryCard({ icon: Icon, label, value, alert }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`flex items-center gap-3 border border-border bg-background rounded-md px-4 py-3 ${alert ? "ring-1 ring-amber-300" : ""}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-md ${alert ? "bg-amber-50 text-amber-600" : "bg-section text-foreground-secondary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function HealthCard({ report }: { report: HealthReport }) {
  const Icon = PROVIDER_ICONS[report.provider] ?? Plug;
  const needsAttention = report.status === "error" || report.status === "reauthorization_required" || report.webhookStats.deadLetter > 0 || report.syncStats.failed > 0;
  const credentialExpiringSoon = report.credentialHealth.daysUntilExpiry != null && report.credentialHealth.daysUntilExpiry <= 7;

  return (
    <Card className={needsAttention ? "ring-1 ring-amber-300" : ""}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-section">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{humanize(report.provider)}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={INTEGRATION_STATUS_COLORS[report.status] ?? "bg-slate-100 text-slate-600"}>{humanize(report.status)}</Badge>
              {needsAttention && <Badge className="bg-amber-100 text-amber-700">Needs Attention</Badge>}
            </div>
          </div>
        </div>
        <Link href={`/integrations/${report.integrationId}`} className="text-sm text-foreground-muted hover:text-foreground">
          Details →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4 lg:grid-cols-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Leads Ingested</p>
          <p className="text-base font-semibold text-foreground">{report.leadStats.totalIngested}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Duplicates</p>
          <p className="text-base font-semibold text-foreground">{report.leadStats.duplicates}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Webhooks</p>
          <p className="text-base font-semibold text-foreground">{report.webhookStats.received}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Dead Letter</p>
          <p className={`text-base font-semibold ${report.webhookStats.deadLetter > 0 ? "text-rose-600" : "text-foreground"}`}>{report.webhookStats.deadLetter}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Failed Syncs</p>
          <p className={`text-base font-semibold ${report.syncStats.failed > 0 ? "text-rose-600" : "text-foreground"}`}>{report.syncStats.failed}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Token Expiry</p>
          <p className={`text-base font-semibold ${credentialExpiringSoon ? "text-amber-600" : "text-foreground"}`}>
            {report.credentialHealth.daysUntilExpiry != null ? `${report.credentialHealth.daysUntilExpiry}d` : "—"}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function IntegrationsDashboardPage() {
  const { data, isLoading, isError, refetch } = useIntegrationsDashboard();

  if (isLoading) return <div><PageHeader title="Integrations Dashboard" /><LoadingState /></div>;
  if (isError) return <div><PageHeader title="Integrations Dashboard" /><ErrorState onRetry={refetch} /></div>;
  if (!data) return <EmptyState title="No data" />;

  const s = data.summary;

  return (
    <AccessGuard module="integrations" page="all_integrations" action="health">
      <div className="space-y-5">
        <PageHeader
          title="Integrations Dashboard"
          subtitle="Observability across all connected lead source integrations"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <SummaryCard icon={Plug} label="Total Integrations" value={s.totalIntegrations} />
          <SummaryCard icon={Activity} label="Active" value={s.activeIntegrations} />
          <SummaryCard icon={AlertTriangle} label="Needing Attention" value={s.needingAttention} alert={s.needingAttention > 0} />
          <SummaryCard icon={TrendingUp} label="Leads Ingested" value={s.totalLeadsIngested} />
          <SummaryCard icon={Copy} label="Duplicates" value={s.totalDuplicates} />
          <SummaryCard icon={MailWarning} label="Dead Letter Events" value={s.totalDeadLetterEvents} alert={s.totalDeadLetterEvents > 0} />
          <SummaryCard icon={XCircle} label="Failed Syncs" value={s.totalFailedSyncs} alert={s.totalFailedSyncs > 0} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Per-Integration Health</h2>
          {data.integrations.length === 0 ? (
            <EmptyState title="No integrations" message="Connect an integration to see health metrics." icon={<Plug className="h-6 w-6" />} />
          ) : (
            data.integrations.map(report => <HealthCard key={report.integrationId} report={report} />)
          )}
        </div>
      </div>
    </AccessGuard>
  );
}
