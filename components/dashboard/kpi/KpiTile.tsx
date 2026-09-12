"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import { Sparkline } from "@/components/dashboard/charts/Sparkline";
import { SERIES, formatPercent } from "@/components/dashboard/charts/theme";

export type KpiAccent = "ink" | "revenue" | "risk" | "negative" | "muted";

const ACCENT_BAR: Record<KpiAccent, string> = {
  ink: "bg-zinc-900",
  revenue: "bg-teal-700",
  risk: "bg-amber-500",
  negative: "bg-red-600",
  muted: "bg-zinc-300",
};

const SPARK_COLOR: Record<KpiAccent, string> = {
  ink: SERIES.ink,
  revenue: SERIES.revenue,
  risk: SERIES.risk,
  negative: SERIES.negative,
  muted: SERIES.mist,
};

export interface KpiTileProps {
  label: string;
  /** Pre-formatted headline value — tiles never guess at formatting. */
  value: string;
  /** Supporting line under the value (e.g. "AED 1.2M closed"). */
  hint?: string;
  /** Percentage change vs the previous period. */
  delta?: number | null;
  /** Set when a rise is bad (response time, missed follow-ups). */
  invertDelta?: boolean;
  deltaLabel?: string;
  accent?: KpiAccent;
  sparkline?: number[];
  href?: string;
  loading?: boolean;
  className?: string;
}

/** Direction chip. Neutral styling at ~0% so noise doesn't read as signal. */
function DeltaChip({
  delta,
  invert,
  label,
}: {
  delta: number;
  invert?: boolean;
  label?: string;
}) {
  const flat = Math.abs(delta) < 0.5;
  const isGood = invert ? delta < 0 : delta > 0;

  const Icon = flat ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const tone = flat
    ? "text-zinc-400 bg-zinc-50 border-zinc-200/70"
    : isGood
      ? "text-teal-700 bg-teal-50/70 border-teal-200/70"
      : "text-red-700 bg-red-50/70 border-red-200/70";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        tone,
      )}
      title={label ?? "vs previous period"}
    >
      <Icon className="h-3 w-3" />
      {formatPercent(Math.abs(delta), 0)}
    </span>
  );
}

/**
 * Single KPI cell in the dashboard hero row.
 *
 * Follows the existing dashboard's editorial style: uppercase micro-label,
 * oversized numeral, accent rule pinned to the bottom edge.
 */
export function KpiTile({
  label,
  value,
  hint,
  delta,
  invertDelta,
  deltaLabel,
  accent = "ink",
  sparkline,
  href,
  loading,
  className,
}: KpiTileProps) {
  const body = (
    <>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {label}
          </span>
          {!loading && delta != null && (
            <DeltaChip delta={delta} invert={invertDelta} label={deltaLabel} />
          )}
        </div>

        {loading ? (
          <Skeleton className="mt-3 h-9 w-24" />
        ) : (
          <div className="mt-2 font-secondary text-3xl font-extrabold tracking-tight text-neutral-900">
            {value}
          </div>
        )}

        {!loading && hint && (
          <p className="mt-1 truncate text-xs font-medium text-neutral-500">{hint}</p>
        )}
      </div>

      {!loading && sparkline && sparkline.length > 1 && (
        <div className="mt-2">
          <Sparkline values={sparkline} color={SPARK_COLOR[accent]} />
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 rounded-full",
          ACCENT_BAR[accent],
        )}
      />
    </>
  );

  const shell = cn(
    "relative flex h-full min-h-36 flex-col justify-between px-4 pb-4 pt-2",
    href && "rounded-xl transition-colors hover:bg-neutral-50/60",
    className,
  );

  if (href && !loading) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}

/**
 * Divider-separated KPI strip. Scrolls horizontally on narrow screens rather
 * than reflowing into a tall stack that pushes the charts below the fold.
 */
export function KpiRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-1 flex snap-x gap-0 overflow-x-auto border-b border-neutral-200/80 pb-6",
        "divide-x divide-neutral-200/70 sm:overflow-visible",
        "[&>*]:min-w-44 [&>*]:flex-1 [&>*]:snap-start",
        className,
      )}
    >
      {children}
    </div>
  );
}
