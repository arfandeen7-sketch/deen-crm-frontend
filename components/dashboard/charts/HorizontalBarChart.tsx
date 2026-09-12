"use client";

import { cn } from "@/lib/utils";
import { SERIES } from "./theme";

export interface HorizontalBarDatum {
  label: string;
  value: number;
  /** Optional secondary figure rendered to the right of the value. */
  meta?: string;
  color?: string;
  href?: string;
}

/**
 * Ranked horizontal bars rendered as CSS rather than SVG.
 *
 * Deliberately not Recharts: leaderboards and workload lists need selectable
 * text labels, links and arbitrary meta columns, which are far cleaner in DOM.
 * The visual language (hairline track, squared-off fill) matches the SVG charts.
 */
export function HorizontalBarChart({
  data,
  valueFormatter = (v) => Math.round(v).toLocaleString(),
  emptyMessage = "No data for this period",
  barColor = SERIES.ink,
  showRank = false,
  className,
}: {
  data: HorizontalBarDatum[];
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  barColor?: string;
  showRank?: boolean;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs font-medium text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className={cn("flex h-full flex-col justify-center gap-3", className)}>
      {data.map((item, index) => {
        const width = Math.max(1.5, (item.value / max) * 100);
        const color = item.color ?? barColor;
        const row = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                {showRank && (
                  <span className="w-4 shrink-0 font-secondary text-[11px] font-bold tabular-nums text-zinc-300">
                    {index + 1}
                  </span>
                )}
                <span className="truncate text-xs font-semibold text-zinc-700">
                  {item.label}
                </span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                {item.meta && (
                  <span className="text-[11px] font-medium text-zinc-400">
                    {item.meta}
                  </span>
                )}
                <span className="text-xs font-bold tabular-nums text-zinc-900">
                  {valueFormatter(item.value)}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            </div>
          </>
        );

        return (
          <li key={`${item.label}-${index}`}>
            {item.href ? (
              <a
                href={item.href}
                className="block rounded-lg px-1 py-0.5 -mx-1 transition-colors hover:bg-zinc-50"
              >
                {row}
              </a>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
