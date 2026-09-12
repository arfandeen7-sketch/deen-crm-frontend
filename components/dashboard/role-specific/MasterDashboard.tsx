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
import { EmployeeActivitySection } from "@/components/dashboard/EmployeeActivitySection";
import { TodoListWidget } from "@/components/dashboard/TodoListWidget";
import { EmployeeTodosWidget } from "@/components/dashboard/EmployeeTodosWidget";

/**
 * Master dashboard — company health and where to put attention next.
 *
 * Reading order is deliberate: are we on track (KPIs + target), why (trend,
 * funnel, channels), who (leaderboard), then what to fix (attention queues).
 */
export function MasterDashboard() {
  const period = usePeriod();
  const overview = useSalesOverview(period);
  const sources = useSourcePerformance(period);
  const team = useTeamPerformance(period);
  const attention = useAttention();
  const deals = useAnalyticsRecentDeals(6);

  const data = overview.data;
  const kpis = data?.kpis.current;
  const deltas = data?.kpis.deltas;
  const loading = overview.isLoading;
  const caption = comparisonLabel(period);

  const revenueSpark = useMemo(
    () => (data?.trend ?? []).map((p) => p.revenue),
    [data?.trend],
  );
  const leadsSpark = useMemo(
    () => (data?.trend ?? []).map((p) => p.leads),
    [data?.trend],
  );

  // Workload balance: how evenly the incoming pipeline is spread across the team.
  const workload = useMemo(() => {
    const rows = team.data?.rows ?? [];
    return rows
      .filter((row) => row.activeLeads > 0 || row.leadsAssigned > 0)
      .sort((a, b) => b.activeLeads - a.activeLeads)
      .slice(0, 8)
      .map((row) => ({
        label: row.fullName,
        value: row.activeLeads,
        meta:
          row.missedFollowups > 0
            ? `${row.missedFollowups} missed`
            : `${formatPercent(row.touchRate, 0)} touched`,
        color: row.missedFollowups > 0 ? SERIES.risk : SERIES.ink,
      }));
  }, [team.data?.rows]);

  return (
    <div className="pb-12 font-sans">
      <DashboardHeader
        title="Business Overview"
        subtitle={`Company-wide performance · comparisons ${caption}`}
      />

      <KpiRow>
        <KpiTile
          label="Revenue Closed"
          value={formatAed(kpis?.revenue ?? 0, {
            compact: (kpis?.revenue ?? 0) >= 1_000_000,
          })}
          hint={`${formatNumber(kpis?.dealsClosed ?? 0)} deals · avg ${formatAed(
            kpis?.avgDealValue ?? 0,
            { compact: true },
          )}`}
          delta={deltas?.revenue}
          deltaLabel={caption}
          accent="revenue"
          sparkline={revenueSpark}
          loading={loading}
        />
        <KpiTile
          label="New Leads"
          value={formatNumber(kpis?.leadsCreated ?? 0)}
          hint={`${formatNumber(kpis?.leadsAssigned ?? 0)} assigned`}
          delta={deltas?.leadsCreated}
          deltaLabel={caption}
          accent="ink"
          sparkline={leadsSpark}
          loading={loading}
        />
        <KpiTile
          label="Win Rate"
          value={formatPercent(kpis?.winRate ?? 0)}
          hint={`${formatPercent(kpis?.qualifiedRate ?? 0, 0)} reached qualified`}
          delta={deltas?.winRate}
          deltaLabel={caption}
          accent="ink"
          loading={loading}
        />
        <KpiTile
          label="First Response"
          value={formatHours(kpis?.avgFirstResponseHours)}
          hint={`${formatPercent(kpis?.touchRate ?? 0, 0)} of assigned leads touched`}
          delta={deltas?.avgFirstResponseHours}
          invertDelta
          deltaLabel={caption}
          accent={
            (kpis?.avgFirstResponseHours ?? 0) > 24 ? "risk" : "ink"
          }
          loading={loading}
        />
        <KpiTile
          label="Open Pipeline"
          value={formatNumber(data?.activeLeads ?? 0)}
          hint={`${formatNumber(data?.pendingFollowups.today ?? 0)} follow-ups due today`}
          accent="muted"
          href="/leads"
          loading={loading}
        />
        <KpiTile
          label="Missed Follow-ups"
          value={formatNumber(data?.pendingFollowups.missed ?? 0)}
          hint="Across the whole company"
          accent={
            (data?.pendingFollowups.missed ?? 0) > 0 ? "negative" : "muted"
          }
          href="/followup/missed"
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
                  ? "Monthly revenue goal with pace marker"
                  : "No target set for this month"
              }
              href="/targets"
            />
            <div className="mt-4 flex-1">
              <TargetCard
                target={data?.target}
                current={data?.kpis.current}
                previous={data?.kpis.previous}
                revenueDelta={deltas?.revenue}
                loading={loading}
                canManage
                comparisonCaption={caption}
              />
            </div>
          </div>
        }
      />

      {/* ── Funnel + status mix ── */}
      <DashboardSplit
        primary={<FunnelPanel funnel={data?.funnel} loading={loading} />}
        secondary={
          <StatusMixPanel statusMix={data?.statusMix} loading={loading} />
        }
      />

      {/* ── Channel ROI + latest deals ── */}
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

      {/* ── People: leaderboard + workload ── */}
      <DashboardSplit
        primary={
          <TeamLeaderboard
            rows={team.data?.rows}
            loading={team.isLoading}
            subtitle="Click a name for the full employee report"
          />
        }
        secondary={
          <ChartFrame
            title="Workload Balance"
            subtitle="Open leads per rep — amber flags missed follow-ups"
            height={260}
            loading={team.isLoading}
            isEmpty={workload.length === 0}
            emptyMessage="No active leads assigned"
          >
            <div className="h-full overflow-y-auto pr-1">
              <HorizontalBarChart data={workload} valueFormatter={formatNumber} />
            </div>
          </ChartFrame>
        }
      />

      {/* ── Action queues ── */}
      <DashboardSplit
        primary={
          <AttentionPanel data={attention.data} loading={attention.isLoading} />
        }
        secondary={<QuickActionsPanel role="master" />}
      />

      {/* ── Operational detail ── */}
      <DashboardSection>
        <EmployeeActivitySection showLeadData={true} />
      </DashboardSection>

      <DashboardSplit
        split="1/2"
        primary={<TodoListWidget />}
        secondary={<EmployeeTodosWidget />}
      />
    </div>
  );
}
