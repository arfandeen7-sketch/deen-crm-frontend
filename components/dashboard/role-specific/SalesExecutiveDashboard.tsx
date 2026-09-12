"use client";

import { useMemo } from "react";
import { CalendarClock, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { KpiRow, KpiTile } from "@/components/dashboard/kpi/KpiTile";
import {
  DashboardHeader,
  DashboardSection,
  DashboardSplit,
  PanelHeading,
} from "@/components/dashboard/widgets/DashboardShell";
import { TodayAgenda } from "@/components/dashboard/widgets/TodayAgenda";
import { MyActivityPanel, RankCard } from "@/components/dashboard/widgets/MyActivityPanel";
import { FunnelPanel, StatusMixPanel } from "@/components/dashboard/widgets/PipelinePanel";
import { RevenueSparkPanel } from "@/components/dashboard/widgets/RevenueTrendPanel";
import { AttentionPanel } from "@/components/dashboard/widgets/AttentionPanel";
import { TargetCard } from "@/components/dashboard/widgets/TargetCard";
import { QuickActionsPanel } from "@/components/dashboard/widgets/QuickActionsPanel";
import {
  formatAed,
  formatHours,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/charts/theme";
import {
  comparisonLabel,
  usePeriod,
} from "@/components/dashboard/filters/PeriodSelector";
import { useAttention, useMyPerformance } from "@/hooks/useDashboardAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { AttendanceCheckInOut } from "@/components/hrms/AttendanceCheckInOut";
import { TodoListWidget } from "@/components/dashboard/TodoListWidget";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import type { MyHrSnapshot } from "@/types";

/** My HR snapshot — attendance and leave, kept compact beside the check-in card. */
function MyHrCard({
  hr,
  loading,
}: {
  hr: MyHrSnapshot | undefined;
  loading?: boolean;
}) {
  const mtd = hr?.monthToDate;

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        My month so far
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Days present
          </dt>
          <dd className="font-secondary text-lg font-bold text-zinc-900">
            {loading ? "…" : formatNumber(mtd?.present ?? 0)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Late arrivals
          </dt>
          <dd
            className={
              (mtd?.late ?? 0) > 0
                ? "font-secondary text-lg font-bold text-amber-700"
                : "font-secondary text-lg font-bold text-zinc-900"
            }
          >
            {loading ? "…" : formatNumber(mtd?.late ?? 0)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Avg hours / day
          </dt>
          <dd className="font-secondary text-lg font-bold text-zinc-900">
            {loading ? "…" : formatHours(mtd?.avgWorkingHours)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Leaves pending
          </dt>
          <dd className="font-secondary text-lg font-bold text-zinc-900">
            {loading ? "…" : formatNumber(hr?.pendingLeaves ?? 0)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-100 pt-3">
        <Link
          href="/my-hr/attendance"
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
        >
          <CalendarClock className="h-3 w-3" />
          Attendance
        </Link>
        <Link
          href="/my-hr/leaves"
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
        >
          <Clock className="h-3 w-3" />
          Leaves
        </Link>
        <Link
          href="/my-hr/payslips"
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
        >
          <FileText className="h-3 w-3" />
          Payslips
        </Link>
      </div>
    </div>
  );
}

/**
 * Sales executive dashboard — personal productivity.
 *
 * Today's Agenda sits at the top because an executive's first question is "who
 * do I call now", not "how did the quarter go". Performance context follows.
 */
export function SalesExecutiveDashboard() {
  const { user } = useAuth();
  const period = usePeriod();
  const performance = useMyPerformance(period, 14);
  const attention = useAttention();

  const data = performance.data;
  const kpis = data?.kpis.current;
  const deltas = data?.kpis.deltas;
  const loading = performance.isLoading;
  const caption = comparisonLabel(period);

  const revenueSpark = useMemo(
    () => (data?.trend ?? []).map((p) => p.revenue),
    [data?.trend],
  );

  const firstName = user?.fullName?.split(" ")[0];

  return (
    <div className="pb-12 font-sans">
      <DashboardHeader
        title={firstName ? `Hello, ${firstName}` : "My Dashboard"}
        subtitle={`Your pipeline and performance · comparisons ${caption}`}
      />

      <KpiRow>
        <KpiTile
          label="Due Today"
          value={formatNumber(data?.pendingFollowups.today ?? 0)}
          hint={`${formatNumber(data?.pendingFollowups.upcoming ?? 0)} scheduled later`}
          accent="ink"
          href="/followup/today"
          loading={loading}
        />
        <KpiTile
          label="Overdue"
          value={formatNumber(data?.pendingFollowups.missed ?? 0)}
          hint="Follow-up date has passed"
          accent={
            (data?.pendingFollowups.missed ?? 0) > 0 ? "negative" : "muted"
          }
          href="/followup/missed"
          loading={loading}
        />
        <KpiTile
          label="My Revenue"
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
          label="Open Leads"
          value={formatNumber(data?.activeLeads ?? 0)}
          hint={`${formatNumber(kpis?.leadsAssigned ?? 0)} assigned this period`}
          accent="muted"
          href="/leads"
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
          label="My Response Time"
          value={formatHours(kpis?.avgFirstResponseHours)}
          hint="Assignment to first contact"
          delta={deltas?.avgFirstResponseHours}
          invertDelta
          deltaLabel={caption}
          accent={(kpis?.avgFirstResponseHours ?? 0) > 24 ? "risk" : "ink"}
          loading={loading}
        />
      </KpiRow>

      {/* ── Hero: what to do now ── */}
      <DashboardSplit
        divider={false}
        primary={<TodayAgenda />}
        secondary={
          <div className="flex h-full flex-col gap-4">
            <RankCard rank={data?.rank} loading={loading} />
            <div className="flex-1">
              <PanelHeading
                title="My Target"
                subtitle={
                  data?.target
                    ? "Your monthly revenue goal"
                    : "No personal target this month"
                }
              />
              <div className="mt-3">
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
          </div>
        }
      />

      {/* ── Effort and outcome ── */}
      <DashboardSplit
        primary={<MyActivityPanel trend={data?.activityTrend} loading={loading} />}
        secondary={
          <RevenueSparkPanel
            trend={data?.trend}
            granularity={data?.period.granularity}
            loading={loading}
            title="My Revenue Trend"
          />
        }
      />

      {/* ── Pipeline shape ── */}
      <DashboardSplit
        primary={
          <FunnelPanel
            funnel={data?.funnel}
            loading={loading}
            title="My Conversion"
            subtitle="Leads that came to me in this period"
          />
        }
        secondary={
          <StatusMixPanel
            statusMix={data?.statusMix}
            loading={loading}
            title="My Pipeline"
          />
        }
      />

      {/* ── Risk queue ── */}
      <DashboardSplit
        primary={
          <AttentionPanel
            data={attention.data}
            loading={attention.isLoading}
            title="Leads At Risk"
            subtitle="Your leads that need action today"
          />
        }
        secondary={<TodoListWidget />}
      />

      {/* ── Recent work ── */}
      <DashboardSplit
        primary={
          <RecentLeadsTable
            assignedTo={user?.id}
            title="My Recent Leads"
            subtitle="Newest assignments first"
          />
        }
        secondary={
          <div className="flex h-full flex-col gap-4">
            <AttendanceCheckInOut />
            <MyHrCard hr={data?.hr} loading={loading} />
          </div>
        }
      />

      <DashboardSection>
        <QuickActionsPanel role="sales_executive" layout="row" />
      </DashboardSection>
    </div>
  );
}
