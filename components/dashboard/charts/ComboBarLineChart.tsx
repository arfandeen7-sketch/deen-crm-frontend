"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import {
  AXIS_PROPS,
  CURSOR_PROPS,
  GRID_PROPS,
  SERIES,
  formatAed,
  formatBucketLabel,
  formatCompact,
  formatFullDate,
} from "./theme";

/**
 * Revenue bars with a deal-count line on a second axis — the "did we sell more,
 * or just bigger?" view. Bars carry money, the line carries volume.
 */
export function ComboBarLineChart<T extends object>({
  data,
  barKey,
  barLabel,
  lineKey,
  lineLabel,
  xKey = "bucket",
  granularity = "day",
  barColor = SERIES.revenue,
  lineColor = SERIES.ink,
}: {
  data: T[];
  barKey: string;
  barLabel: string;
  lineKey: string;
  lineLabel: string;
  xKey?: string;
  granularity?: "day" | "week" | "month";
  barColor?: string;
  lineColor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey={xKey}
          {...AXIS_PROPS}
          tickFormatter={(value: string) => formatBucketLabel(value, granularity)}
          minTickGap={16}
        />
        <YAxis
          yAxisId="money"
          {...AXIS_PROPS}
          width={44}
          tickFormatter={(value: number) => formatCompact(value)}
        />
        <YAxis
          yAxisId="count"
          orientation="right"
          {...AXIS_PROPS}
          width={28}
          allowDecimals={false}
          tickFormatter={(value: number) => formatCompact(value)}
        />
        <Tooltip
          cursor={CURSOR_PROPS}
          content={
            <ChartTooltip
              titleFormatter={(label) => formatFullDate(String(label))}
              rows={(payload) =>
                payload.map((entry) => {
                  const isMoney = entry.dataKey === barKey;
                  const value = Number(entry.value ?? 0);
                  return {
                    label: isMoney ? barLabel : lineLabel,
                    value: isMoney ? formatAed(value) : formatCompact(value),
                    color: isMoney ? barColor : lineColor,
                  };
                })
              }
            />
          }
        />

        <Bar
          yAxisId="money"
          dataKey={barKey}
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={34}
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey={lineKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#FFFFFF" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
