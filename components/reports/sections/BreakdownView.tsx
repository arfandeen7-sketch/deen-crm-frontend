"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AXIS_PROPS, GRID_PROPS, CURSOR_PROPS } from "@/components/dashboard/charts/theme";
import { formatValue } from "../format";
import type { BreakdownSection, ReportMeta } from "@/types/reports";

export function BreakdownView({ section, meta }: { section: BreakdownSection; meta: ReportMeta }) {
  if (section.items.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
        <div className="flex h-48 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50/50 text-sm text-neutral-400">
          No data for this period.
        </div>
      </section>
    );
  }

  const total = section.items.reduce((s, i) => s + i.value, 0) || 1;

  if (section.display === "donut") {
    const data = section.items.map((i) => ({
      name: i.label,
      value: i.value,
      color: i.color ?? "#A1A1AA",
    }));
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={1}
                  stroke="none"
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={CURSOR_PROPS}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E8E8E8", fontSize: 12 }}
                  formatter={(v) => formatValue((Array.isArray(v) ? v[0] : v) ?? 0, section.valueFormat, { currency: meta.currency })}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            {section.items.map((i) => (
              <div key={i.label} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: i.color ?? "#A1A1AA" }} />
                  <span className="truncate text-neutral-600">{i.label}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="font-medium text-neutral-900">
                    {formatValue(i.value, section.valueFormat, { currency: meta.currency })}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {((i.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // bars / stacked → horizontal bar chart
  const data = section.items.map((i) => ({
    name: i.label,
    value: i.value,
    color: i.color ?? "#111111",
  }));
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis {...AXIS_PROPS} type="number" />
            <YAxis
              {...AXIS_PROPS}
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: "#8A8A8A", fontFamily: "var(--font-dm-sans)" }}
            />
            <Tooltip
              cursor={CURSOR_PROPS}
              contentStyle={{ borderRadius: 8, border: "1px solid #E8E8E8", fontSize: 12 }}
              formatter={(v) => formatValue((Array.isArray(v) ? v[0] : v) ?? 0, section.valueFormat, { currency: meta.currency })}
            />
            <Bar dataKey="value" radius={[0, 2, 2, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
