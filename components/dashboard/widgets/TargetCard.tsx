"use client";

import Link from "next/link";
import { Target, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import { RadialProgress } from "@/components/dashboard/charts/RadialProgress";
import { formatAed, formatPercent } from "@/components/dashboard/charts/theme";
import type { SalesKpis, TargetProgress } from "@/types";

/**
 * Target-vs-actual card with a graceful no-target mode.
 *
 * Targets are optional in this system, so when none is configured for the month
 * this renders a period-over-period comparison instead of an empty gauge — the
 * dashboard stays useful either way.
 */
export function TargetCard({
  target,
  current,
  previous,
  revenueDelta,
  loading,
  canManage,
  comparisonCaption,
}: {
  target: TargetProgress | null | undefined;
  current: SalesKpis | undefined;
  previous: SalesKpis | undefined;
  revenueDelta: number | null | undefined;
  loading?: boolean;
  /** Shows the "set targets" affordance (master only). */
  canManage?: boolean;
  comparisonCaption: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-5">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    );
  }

  const revenue = current?.revenue ?? 0;

  // ── No target configured: fall back to comparison ──
  if (!target) {
    const delta = revenueDelta ?? null;
    const isUp = (delta ?? 0) >= 0;
    const Icon = isUp ? TrendingUp : TrendingDown;

    return (
      <div className="flex h-full flex-col justify-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Revenue closed
          </span>
          {canManage && (
            <Link
              href="/targets"
              className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
            >
              <Target className="h-3 w-3" />
              Set target
            </Link>
          )}
        </div>

        <div className="font-secondary text-3xl font-extrabold tracking-tight text-zinc-900">
          {formatAed(revenue, { compact: revenue >= 1_000_000 })}
        </div>

        <div className="flex items-center gap-2">
          {delta != null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                isUp
                  ? "border-teal-200/70 bg-teal-50/70 text-teal-700"
                  : "border-red-200/70 bg-red-50/70 text-red-700",
              )}
            >
              <Icon className="h-3 w-3" />
              {formatPercent(Math.abs(delta), 0)}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-zinc-400">
              No comparable figure
            </span>
          )}
          <span className="text-[11px] text-zinc-400">{comparisonCaption}</span>
        </div>

        <p className="text-[11px] text-zinc-400">
          Previous period: {formatAed(previous?.revenue ?? 0, { compact: true })}
        </p>
      </div>
    );
  }

  // ── Target configured: gauge + pace ──
  const remaining = Math.max(0, target.revenueTarget - revenue);
  const paceGap = target.revenueProgress - target.pace;

  return (
    <div className="flex h-full flex-col items-center gap-5 sm:flex-row">
      <RadialProgress
        progress={target.revenueProgress}
        pace={target.pace}
        primaryLabel="of target"
        secondaryLabel={`${formatPercent(target.pace, 0)} elapsed`}
      />

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Revenue closed
        </p>
        <p className="mt-1 font-secondary text-2xl font-extrabold tracking-tight text-zinc-900">
          {formatAed(revenue, { compact: revenue >= 1_000_000 })}
        </p>
        <p className="mt-0.5 text-xs font-medium text-zinc-500">
          of {formatAed(target.revenueTarget, { compact: true })} target
        </p>

        <div className="mt-3 space-y-1">
          <p
            className={cn(
              "text-xs font-bold",
              target.onTrack ? "text-teal-700" : "text-amber-700",
            )}
          >
            {target.onTrack ? "On track" : "Behind pace"}
            <span className="ml-1 font-medium text-zinc-400">
              ({paceGap >= 0 ? "+" : ""}
              {formatPercent(paceGap, 0)} vs pace)
            </span>
          </p>
          {remaining > 0 ? (
            <p className="text-[11px] text-zinc-400">
              {formatAed(remaining, { compact: true })} still to close
            </p>
          ) : (
            <p className="text-[11px] font-medium text-teal-700">Target met</p>
          )}
          {target.dealsTarget > 0 && (
            <p className="text-[11px] text-zinc-400">
              Deals: {current?.dealsClosed ?? 0} of {target.dealsTarget} (
              {formatPercent(target.dealsProgress, 0)})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
