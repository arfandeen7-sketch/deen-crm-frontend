"use client";

import { useMemo } from "react";
import { KpiRow, KpiTile } from "@/components/dashboard/kpi/KpiTile";
import {
  DashboardHeader,
  DashboardSection,
  DashboardSplit,
  PanelHeading,
} from "@/components/dashboard/widgets/DashboardShell";
import { RevenueTrendPanel } from "@/components/dashboard/widgets/RevenueTrendPanel";
import { FunnelPanel, StatusMixPanel } from "@/components/dashboard/widgets/PipelinePanel";
import { SourcePerformancePanel } from "@/components/dashboard/widgets/SourcePerformancePanel";
import { TeamLeaderboard } from "@/components/dashboard/widgets/TeamLeaderboard";
import { FollowupCompliancePanel } from "@/components/dashboard/widgets/FollowupCompliancePanel";
import { AttentionPanel } from "@/components/dashboard/widgets/AttentionPanel";
import { RecentDealsFeed } from "@/components/dashboard/widgets/RecentDealsFeed";
import { TargetCard } from "@/components/dashboard/widgets/TargetCard";
import { QuickActionsPanel } from "@/components/dashboard/widgets/QuickActionsPanel";
import { ChartFrame } from "@/components/dashboard/charts/ChartFrame";
import { HorizontalBarChart } from "@/components/dashboard/charts/HorizontalBarChart";
import {
  SERIES,
  formatAed,
  formatHours,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/charts/theme";
import {
  comparisonLabel,
  usePeriod,
} from "@/components/dashboard/filters/PeriodSelector";
import {
  useAnalyticsRecentDeals,
  useAttention,
  useSalesOverview,
  useSourcePerformance,
  useTeamPerformance,
} from "@/hooks/useDashboardAnalytics";
import { FollowUpsWidget } from "@/components/dashboard/FollowUpsWidget";
import { TodoListWidget } from "@/components/dashboard/TodoListWidget";

/**
 * Sales manager dashboard — team execution.
 *
 * Same metric vocabulary as the master view but scoped to the manager's team,
 * with the diagnostic panels (workload, follow-up hygiene) promoted above the
 * channel analysis: a manager's leverage is redistributing work, not media spend.
 */
export function SalesManagerDashboard() {
  const period = usePeriod();
  const overview = useSalesOverview(period);
  const team = useTeamPerformance(period);
  const sources = useSourcePerformance(period);
  const attention = useAttention();
  const deals = useAnalyticsRecentDeals(5);

  const data = overview.data;
  const kpis = data?.kpis.current;
  const deltas = data?.kpis.deltas;
  const loading = overview.isLoading;
  const caption = comparisonLabel(period);

  const revenueSpark = useMemo(
    () => (data?.trend ?? []).map((p) => p.revenue),
    [data?.trend],
  );

  const teamRows = useMemo(() => team.data?.rows ?? [], [team.data?.rows]);
  const activeRepCount = teamRows.filter((r) => r.activeLeads > 0).length;

  const workload = useMemo(
    () =>
      teamRows
        .slice()
        .sort((a, b) => b.activeLeads - a.activeLeads)
        .slice(0, 8)
        .map((row) => ({
          label: row.fullName,
          value: row.activeLeads,
          meta:
            row.untouched > 0
              ? `${row.untouched} untouched`
              : `${formatPercent(row.touchRate, 0)} touched`,
          color: row.untouched > 0 ? SERIES.risk : SERIES.ink,
        })),
    [teamRows],
  );

  return (
    <div className="pb-12 font-sans">
      <DashboardHeader
        title="Team Overview"
        subtitle={`Your team's performance · comparisons ${caption}`}
      />

      <KpiRow>
        <KpiTile
          label="Team Revenue"
          value={formatAed(kpis?.revenue ?? 0, {
            compact: (kpis?.revenue ?? 0) >= 1_000_000,
          })}
          hint={`${formatNumber(kpis?.dealsClosed ?? 0)} deals closed`}
          delta={deltas?.revenue}
          deltaLabel={caption}
          accent="revenue"
          sparkline={revenueSpark}
          loading={loading}
        />
        <KpiTile
          label="Leads Assigned"
          value={formatNumber(kpis?.leadsAssigned ?? 0)}
          hint={`${formatNumber(kpis?.leadsCreated ?? 0)} created in period`}
          delta={deltas?.leadsAssigned}
          deltaLabel={caption}
          accent="ink"
          loading={loading}
        />
        <KpiTile
          label="Touch Rate"
          value={formatPercent(kpis?.touchRate ?? 0, 0)}
          hint={`${formatNumber(team.data?.totals.untouched ?? 0)} never contacted`}
          delta={deltas?.touchRate}
          deltaLabel={caption}
          accent={(kpis?.touchRate ?? 100) < 70 ? "risk" : "ink"}
          loading={loading}
        />
        <KpiTile
          label="First Response"
          value={formatHours(kpis?.avgFirstResponseHours)}
          hint="Assignment to first contact"
          delta={deltas?.avgFirstResponseHours}
          invertDelta
          deltaLabel={caption}
          accent={(kpis?.avgFirstResponseHours ?? 0) > 24 ? "risk" : "ink"}
          loading={loading}
        />
        <KpiTile
          label="Missed Follow-ups"
          value={formatNumber(data?.pendingFollowups.missed ?? 0)}
          hint={`${formatNumber(data?.pendingFollowups.today ?? 0)} due today`}
          accent={
            (data?.pendingFollowups.missed ?? 0) > 0 ? "negative" : "muted"
          }
          href="/followup/missed"
          loading={loading}
        />
        <KpiTile
          label="Win Rate"
          value={formatPercent(kpis?.winRate ?? 0)}
          hint={`${activeRepCount} reps carrying pipeline`}
          delta={deltas?.winRate}
          deltaLabel={caption}
          accent="ink"
          loading={loading}
        />
      </KpiRow>

      {/* ── Trend + target ── */}
      <DashboardSplit
        divider={false}
        primary={
          <RevenueTrendPanel
            trend={data?.trend}
            granularity={data?.period.granularity}
            loading={loading}
          />
        }
        secondary={
          <div className="flex h-full flex-col">
            <PanelHeading
              title="Against Target"
              subtitle={
                data?.target
                  ? "Combined team goal for the month"
                  : "No team target set for this month"
              }
            />
            <div className="mt-4 flex-1">
              <TargetCard
                target={data?.target}
                current={data?.kpis.current}
                previous={data?.kpis.previous}
                revenueDelta={deltas?.revenue}
                loading={loading}
                comparisonCaption={caption}
              />
            </div>
          </div>
        }
      />

      {/* ── Who is performing ── */}
      <DashboardSplit
        primary={
          <TeamLeaderboard
            rows={teamRows}
            loading={team.isLoading}
            title="My Team"
            subtitle="Click a name for the full employee report"
          />
        }
        secondary={
          <ChartFrame
            title="Workload Balance"
            subtitle="Open leads per rep — amber flags untouched leads"
            height={260}
            loading={team.isLoading}
            isEmpty={workload.length === 0}
            emptyMessage="No active leads assigned to your team"
          >
            <div className="h-full overflow-y-auto pr-1">
              <HorizontalBarChart data={workload} valueFormatter={formatNumber} />
            </div>
          </ChartFrame>
        }
      />

      {/* ── Execution hygiene ── */}
      <DashboardSplit
        primary={
          <FollowupCompliancePanel rows={teamRows} loading={team.isLoading} />
        }
        secondary={
          <AttentionPanel
            data={attention.data}
            loading={attention.isLoading}
            subtitle="Within your team's leads"
          />
        }
      />

      {/* ── Pipeline shape ── */}
      <DashboardSplit
        primary={<FunnelPanel funnel={data?.funnel} loading={loading} />}
        secondary={
          <StatusMixPanel statusMix={data?.statusMix} loading={loading} />
        }
      />

      {/* ── Channels + deals ── */}
      <DashboardSplit
        primary={
          <SourcePerformancePanel
            rows={sources.data?.rows}
            loading={sources.isLoading}
          />
        }
        secondary={
          <RecentDealsFeed deals={deals.data} loading={deals.isLoading} />
        }
      />

      {/* ── Personal work ── */}
      <DashboardSplit
        split="1/2"
        primary={<FollowUpsWidget />}
        secondary={<TodoListWidget />}
      />

      <DashboardSection>
        <QuickActionsPanel role="sales_manager" layout="row" />
      </DashboardSection>
    </div>
  );
}
