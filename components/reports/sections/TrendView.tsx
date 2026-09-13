"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { AXIS_PROPS, GRID_PROPS, CURSOR_PROPS } from "@/components/dashboard/charts/theme";
import { formatValue } from "../format";
import type { TrendSection, ReportMeta } from "@/types/reports";

export function TrendView({ section, meta }: { section: TrendSection; meta: ReportMeta }) {
  if (section.points.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
        <div className="flex h-64 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50/50 text-sm text-neutral-400">
          No data for this period.
        </div>
      </section>
    );
  }

  const hasBar = section.series.some((s) => s.style === "bar");
  const hasLineOrArea = section.series.some((s) => s.style === "line" || s.style === "area");
  const useComposed = hasBar && hasLineOrArea;

  const Chart = useComposed ? ComposedChart : hasBar ? BarChart : hasLineOrArea ? LineChart : AreaChart;

  const rightSeries = section.series.filter((s) => s.axis === "right");
  const hasRightAxis = rightSeries.length > 0;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={section.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis
              {...AXIS_PROPS}
              dataKey="bucket"
              tickFormatter={(v: string) => {
                const d = new Date(`${v}T00:00:00Z`);
                return d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
              }}
            />
            <YAxis {...AXIS_PROPS} />
            {hasRightAxis && <YAxis {...AXIS_PROPS} orientation="right" yAxisId="right" />}
            <Tooltip
              cursor={CURSOR_PROPS}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E8E8E8",
                fontSize: 12,
                fontFamily: "var(--font-dm-sans)",
              }}
              formatter={(value, name) => {
                const s = section.series.find((sr) => sr.label === name);
                const v = Array.isArray(value) ? value[0] : value;
                return [formatValue(v ?? 0, s?.format ?? "number", { currency: meta.currency }), name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-dm-sans)" }} />
            {section.series.map((s) => {
              const yAxisId = s.axis === "right" ? "right" : undefined;
              if (s.style === "bar") {
                return (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color}
                    yAxisId={yAxisId}
                    radius={[2, 2, 0, 0]}
                  />
                );
              }
              if (s.style === "line") {
                return (
                  <Line
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={1.5}
                    dot={false}
                    yAxisId={yAxisId}
                  />
                );
              }
              return (
                <Area
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.12}
                  strokeWidth={1.2}
                  yAxisId={yAxisId}
                />
              );
            })}
          </Chart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
