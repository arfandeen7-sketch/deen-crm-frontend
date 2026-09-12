"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import {
  AXIS_PROPS,
  GRID_PROPS,
  SERIES,
  formatBucketLabel,
  formatCompact,
  formatFullDate,
} from "./theme";

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
  /** Formats the value in the tooltip; axis ticks always use compact numbers. */
  format?: (value: number) => string;
}

/**
 * Gradient area chart for time series. Handles one or more series; the first is
 * drawn on top so the primary metric stays readable.
 */
export function AreaTrendChart<T extends object>({
  data,
  series,
  xKey = "bucket",
  granularity = "day",
  yAxisWidth = 40,
}: {
  data: T[];
  series: AreaSeries[];
  xKey?: string;
  granularity?: "day" | "week" | "month";
  yAxisWidth?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`area-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey={xKey}
          {...AXIS_PROPS}
          tickFormatter={(value: string) => formatBucketLabel(value, granularity)}
          minTickGap={16}
        />
        <YAxis
          {...AXIS_PROPS}
          width={yAxisWidth}
          tickFormatter={(value: number) => formatCompact(value)}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: SERIES.mist, strokeDasharray: "3 3" }}
          content={
            <ChartTooltip
              titleFormatter={(label) => formatFullDate(String(label))}
              rows={(payload) =>
                payload.map((entry) => {
                  const match = series.find((s) => s.key === entry.dataKey);
                  const value = Number(entry.value ?? 0);
                  return {
                    label: match?.label ?? String(entry.dataKey),
                    value: match?.format ? match.format(value) : formatCompact(value),
                    color: match?.color,
                  };
                })
              }
            />
          }
        />

        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#area-${s.key})`}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#FFFFFF" }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
