"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import { AXIS_PROPS, CURSOR_PROPS, GRID_PROPS, formatCompact } from "./theme";

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

/**
 * Stacked bars for composition-over-category (follow-up load per rep,
 * attendance mix per day, leave days per type).
 */
export function StackedBarChart<T extends object>({
  data,
  series,
  xKey,
  layout = "horizontal",
  xTickFormatter,
  tooltipTitleFormatter,
  categoryAxisWidth = 88,
}: {
  data: T[];
  series: StackSeries[];
  xKey: string;
  /** "horizontal" = vertical bars; "vertical" = bars running left to right. */
  layout?: "horizontal" | "vertical";
  xTickFormatter?: (value: string) => string;
  tooltipTitleFormatter?: (label: unknown) => string;
  categoryAxisWidth?: number;
}) {
  const isVertical = layout === "vertical";

  const tooltip = (
    <Tooltip
      cursor={CURSOR_PROPS}
      content={
        <ChartTooltip
          titleFormatter={tooltipTitleFormatter}
          rows={(payload) => {
            const rows: TooltipRow[] = [];
            for (const entry of payload) {
              const value = Number(entry.value ?? 0);
              // Zero-value segments add noise to a stacked tooltip.
              if (value === 0) continue;
              const match = series.find((s) => s.key === entry.dataKey);
              rows.push({
                label: match?.label ?? String(entry.dataKey),
                value: formatCompact(value),
                color: match?.color,
              });
            }

            if (rows.length > 1) {
              const total = payload.reduce((sum, e) => sum + Number(e.value ?? 0), 0);
              rows.push({ label: "Total", value: formatCompact(total) });
            }
            return rows;
          }}
        />
      }
    />
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        barCategoryGap={isVertical ? "22%" : "18%"}
      >
        <CartesianGrid {...GRID_PROPS} vertical={isVertical} horizontal={!isVertical} />

        {isVertical ? (
          <>
            <XAxis
              type="number"
              {...AXIS_PROPS}
              allowDecimals={false}
              tickFormatter={(value: number) => formatCompact(value)}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              {...AXIS_PROPS}
              width={categoryAxisWidth}
              tickFormatter={xTickFormatter}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              {...AXIS_PROPS}
              minTickGap={12}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              {...AXIS_PROPS}
              width={36}
              allowDecimals={false}
              tickFormatter={(value: number) => formatCompact(value)}
            />
          </>
        )}

        {tooltip}

        {series.map((s, index) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="stack"
            fill={s.color}
            maxBarSize={isVertical ? 18 : 30}
            radius={
              index === series.length - 1
                ? isVertical
                  ? [0, 4, 4, 0]
                  : [4, 4, 0, 0]
                : undefined
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
