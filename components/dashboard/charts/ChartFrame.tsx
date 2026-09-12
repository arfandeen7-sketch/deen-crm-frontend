"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";

/**
 * Section wrapper shared by every dashboard chart: title, optional subtitle and
 * trailing action, then a fixed-height body that owns the loading skeleton and
 * empty state so charts never cause layout shift.
 */
export function ChartFrame({
  title,
  subtitle,
  action,
  legend,
  height = 260,
  loading,
  isEmpty,
  emptyMessage = "No data for this period",
  className,
  bodyClassName,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  legend?: ReactNode;
  height?: number;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col", className)}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-secondary text-lg font-bold tracking-tight text-zinc-900">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>

      {legend && <div className="mt-3">{legend}</div>}

      <div
        className={cn("mt-4 min-w-0", bodyClassName)}
        style={{ height }}
        aria-busy={loading ? true : undefined}
      >
        {loading ? (
          <ChartSkeleton />
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40">
            <p className="text-xs font-medium text-zinc-400">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/** Bar-shaped shimmer that roughly matches a plotted chart. */
export function ChartSkeleton() {
  const heights = [45, 70, 55, 85, 60, 95, 72, 50, 80, 65, 90, 58];
  return (
    <div className="flex h-full items-end gap-2">
      {heights.map((h, i) => (
        <div key={i} className="flex-1" style={{ height: `${h}%` }}>
          <Skeleton className="h-full w-full rounded-t-md" />
        </div>
      ))}
    </div>
  );
}

/** Inline legend swatch list used above or beside charts. */
export function ChartLegend({
  items,
  className,
}: {
  items: Array<{ label: string; color: string; value?: string }>;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[11px] font-medium text-zinc-500">{item.label}</span>
          {item.value && (
            <span className="text-[11px] font-bold text-zinc-800">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
