"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { categoricalColor, formatNumber, formatPercent } from "./theme";

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

/**
 * Donut with the total in the middle. Segments beyond `maxSlices` are folded
 * into "Other" so the ring stays legible instead of turning into hairlines.
 */
export function DonutBreakdown({
  data,
  centerLabel = "Total",
  maxSlices = 7,
  valueFormatter = formatNumber,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  maxSlices?: number;
  valueFormatter?: (value: number) => string;
}) {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  const sliced =
    sorted.length > maxSlices
      ? [
          ...sorted.slice(0, maxSlices - 1),
          {
            label: "Other",
            value: sorted.slice(maxSlices - 1).reduce((sum, d) => sum + d.value, 0),
          },
        ]
      : sorted;

  const total = sliced.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs font-medium text-zinc-400">Nothing to break down yet</p>
      </div>
    );
  }

  const withColor = sliced.map((d, i) => ({ ...d, color: d.color ?? categoricalColor(i) }));

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={
              <ChartTooltip
                // Pie tooltips carry the slice name on the payload, not on `label`.
                titleFormatter={() => ""}
                rows={(payload) =>
                  payload.map((entry) => {
                    const value = Number(entry.value ?? 0);
                    const slice = entry.payload as
                      | { label?: string; color?: string }
                      | undefined;
                    return {
                      label: slice?.label ?? String(entry.name ?? ""),
                      value: `${valueFormatter(value)} · ${formatPercent(
                        (value / total) * 100,
                        0,
                      )}`,
                      color: slice?.color,
                    };
                  })
                }
              />
            }
          />
          <Pie
            data={withColor}
            dataKey="value"
            nameKey="label"
            innerRadius="64%"
            outerRadius="94%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {withColor.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-secondary text-2xl font-extrabold tracking-tight text-zinc-900">
          {valueFormatter(total)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
