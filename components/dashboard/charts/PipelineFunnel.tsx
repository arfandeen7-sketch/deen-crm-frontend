"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERIES, formatNumber, formatPercent } from "./theme";

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  stageConversion: number;
  overallConversion: number;
}

/**
 * Pipeline funnel with the drop-off between stages called out explicitly.
 *
 * The stage-to-stage percentage is the point of this chart — a funnel that only
 * shows totals makes you do the division yourself, so the conversion (and the
 * loss) is rendered on every step.
 */
export function PipelineFunnel({
  stages,
  className,
}: {
  stages: FunnelStage[];
  className?: string;
}) {
  const top = stages[0]?.count ?? 0;

  if (stages.length === 0 || top === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs font-medium text-zinc-400">
          No leads entered the pipeline in this period
        </p>
      </div>
    );
  }

  return (
    <ol className={cn("flex flex-col gap-1", className)}>
      {stages.map((stage, index) => {
        const width = Math.max(6, (stage.count / top) * 100);
        const isLast = index === stages.length - 1;
        // Darken toward the bottom of the funnel so value concentration reads.
        const shade = [SERIES.mist, "#71717A", SERIES.graphite, "#27272A", SERIES.revenue][
          Math.min(index, 4)
        ];

        return (
          <li key={stage.key}>
            <div className="flex items-center gap-3">
              <div className="w-24 shrink-0 sm:w-28">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {stage.label}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="h-7 w-full overflow-hidden rounded-md bg-zinc-100/70">
                  <div
                    className="flex h-full items-center justify-end rounded-md px-2 transition-all duration-700"
                    style={{ width: `${width}%`, backgroundColor: shade }}
                  >
                    <span className="font-secondary text-xs font-bold tabular-nums text-white">
                      {formatNumber(stage.count)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-12 shrink-0 text-right">
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums",
                    isLast ? "text-teal-700" : "text-zinc-700",
                  )}
                >
                  {formatPercent(stage.overallConversion, 0)}
                </span>
              </div>
            </div>

            {!isLast && (
              <div className="flex items-center gap-3 py-0.5">
                <div className="w-24 shrink-0 sm:w-28" />
                <div className="flex min-w-0 flex-1 items-center gap-1.5 pl-2">
                  <ArrowDown className="h-3 w-3 shrink-0 text-zinc-300" />
                  <span className="text-[11px] font-medium text-zinc-400">
                    {formatPercent(stages[index + 1].stageConversion, 0)} continue
                    {stages[index + 1].count < stage.count && (
                      <span className="text-zinc-300">
                        {" · "}
                        {formatNumber(stage.count - stages[index + 1].count)} lost
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-12 shrink-0" />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
