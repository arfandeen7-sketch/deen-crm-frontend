"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PeriodSelector,
  comparisonLabel,
  usePeriod,
} from "@/components/dashboard/filters/PeriodSelector";

/**
 * Page header for the role dashboards: greeting, the period selector, and the
 * caption that tells the reader what every delta on the page is measured against.
 */
export function DashboardHeader({
  title,
  subtitle,
  showPeriodSelector = true,
  action,
}: {
  title: string;
  subtitle?: string;
  showPeriodSelector?: boolean;
  action?: ReactNode;
}) {
  const period = usePeriod();

  return (
    <header className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-secondary text-2xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          {subtitle ?? `Comparisons shown ${comparisonLabel(period)}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        {showPeriodSelector && <PeriodSelector />}
      </div>
    </header>
  );
}

/**
 * Divider-separated content band, matching the existing dashboard rhythm
 * (hairline rule above, generous vertical padding, no card chrome).
 */
export function DashboardSection({
  children,
  className,
  divider = true,
}: {
  children: ReactNode;
  className?: string;
  divider?: boolean;
}) {
  return (
    <section
      className={cn("py-8", divider && "border-t border-zinc-200", className)}
    >
      {children}
    </section>
  );
}

/**
 * Two-column band with a vertical rule between columns on large screens.
 * `split` controls the ratio of the primary column.
 */
export function DashboardSplit({
  primary,
  secondary,
  split = "2/3",
  className,
  divider = true,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  split?: "2/3" | "1/2";
  className?: string;
  divider?: boolean;
}) {
  return (
    <DashboardSection divider={divider} className={className}>
      <div
        className={cn(
          "grid grid-cols-1 gap-8 lg:gap-12",
          split === "2/3" ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        <div className={cn("min-w-0", split === "2/3" && "lg:col-span-2")}>
          {primary}
        </div>
        <div className="min-w-0 border-t border-zinc-200 pt-8 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          {secondary}
        </div>
      </div>
    </DashboardSection>
  );
}

/** Section heading used inside panels that are not charts. */
export function PanelHeading({
  title,
  subtitle,
  action,
  href,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-secondary text-lg font-bold tracking-tight text-zinc-900">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
      </div>
      {action ??
        (href && (
          <Link
            href={href}
            className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
          >
            View all
          </Link>
        ))}
    </div>
  );
}
