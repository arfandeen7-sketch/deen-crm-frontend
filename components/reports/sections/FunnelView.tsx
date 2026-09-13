"use client";

import { formatValue } from "../format";
import type { FunnelSection } from "@/types/reports";

export function FunnelView({ section }: { section: FunnelSection }) {
  if (section.stages.length === 0) return null;
  const maxCount = section.stages[0]?.count || 1;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
      <div className="space-y-2">
        {section.stages.map((stage, i) => {
          const widthPct = (stage.count / maxCount) * 100;
          const isLast = i === section.stages.length - 1;
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-xs font-medium text-neutral-600">{stage.label}</div>
              <div className="relative flex-1">
                <div
                  className="flex h-9 items-center rounded-md px-3 text-xs font-semibold text-white tabular-nums"
                  style={{
                    width: `${Math.max(widthPct, 8)}%`,
                    background: isLast ? "#0F766E" : i === 0 ? "#111111" : "#3F3F46",
                  }}
                >
                  {formatValue(stage.count, "number")}
                </div>
              </div>
              <div className="w-20 shrink-0 text-right text-xs tabular-nums text-neutral-400">
                {i > 0 ? `${stage.stageConversion.toFixed(1)}%` : ""}
              </div>
              {stage.medianHours !== undefined && stage.medianHours !== null && (
                <div className="w-16 shrink-0 text-right text-xs tabular-nums text-neutral-400">
                  {formatValue(stage.medianHours, "hours")}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-neutral-400">
        Stage conversion shows the percentage moving from the previous stage to this one.
      </p>
    </section>
  );
}
