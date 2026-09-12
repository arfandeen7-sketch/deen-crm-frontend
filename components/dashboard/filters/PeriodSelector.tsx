"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "mtd", label: "MTD" },
  { value: "30d", label: "30D" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
  { value: "12m", label: "12M" },
] as const;

export type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

const VALID = new Set<string>(PERIOD_OPTIONS.map((o) => o.value));

export const DEFAULT_PERIOD: PeriodValue = "mtd";

/**
 * Reads the active period from the URL so a dashboard view is shareable and
 * survives a refresh. Every widget on the page reads the same value.
 */
export function usePeriod(): PeriodValue {
  const searchParams = useSearchParams();
  const raw = searchParams.get("period");
  return raw && VALID.has(raw) ? (raw as PeriodValue) : DEFAULT_PERIOD;
}

export function periodLabel(period: PeriodValue): string {
  return PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;
}

/** Human-readable comparison caption for KPI deltas. */
export function comparisonLabel(period: PeriodValue): string {
  switch (period) {
    case "today":
      return "vs yesterday";
    case "7d":
      return "vs previous 7 days";
    case "30d":
      return "vs previous 30 days";
    case "mtd":
      return "vs same point last month";
    case "qtd":
      return "vs same point last quarter";
    case "ytd":
      return "vs same point last year";
    case "12m":
      return "vs previous 12 months";
    default:
      return "vs previous period";
  }
}

export function PeriodSelector({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = usePeriod();

  const select = useCallback(
    (value: PeriodValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === DEFAULT_PERIOD) params.delete("period");
      else params.set("period", value);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div
      role="group"
      aria-label="Reporting period"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-neutral-200/80 bg-white p-0.5 shadow-2xs",
        className,
      )}
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = option.value === active;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => select(option.value)}
            aria-pressed={isActive}
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
              isActive
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
