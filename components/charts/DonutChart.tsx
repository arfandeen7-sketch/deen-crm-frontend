"use client";

import { cn } from "@/lib/utils";
import { CHART_COLORS } from "./palette";

export interface DonutDatum {
  label: string;
  value: number;
}

export function DonutChart({
  data,
  size = "md",
  showLegend = true,
}: {
  data: DonutDatum[];
  size?: "sm" | "md";
  showLegend?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size === "sm" ? 34 : 70;
  const stroke = size === "sm" ? 14 : 26;
  const circumference = 2 * Math.PI * radius;
  const box = radius * 2 + stroke * 2;
  const center = box / 2;
  const dim = size === "sm" ? "h-20 w-20" : "h-44 w-44";
  let offset = 0;

  if (total === 0) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-full", dim)}>
        No leads
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-6", size === "sm" ? "flex-row justify-start gap-3" : "flex-col sm:flex-row sm:justify-center")}>
      <svg viewBox={`0 0 ${box} ${box}`} className={cn(dim, "-rotate-90 shrink-0 overflow-hidden")}>
        {data.map((d, i) => {
          if (d.value === 0) return null; // Skip empty segments
          const fraction = d.value / total;
          const dash = fraction * circumference;
          
          // SVG stroke-dasharray can be buggy when fraction is exactly 1 (100%).
          // If it's a full ring, just draw a normal circle without dasharray.
          const isFullRing = fraction === 1;

          const seg = (
            <circle
              key={d.label}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={stroke}
              {...(!isFullRing && {
                strokeDasharray: `${dash} ${circumference - dash}`,
                strokeDashoffset: -offset,
              })}
            />
          );
          offset += dash;
          return seg;
        })}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn("fill-slate-900 font-semibold", size === "sm" ? "text-sm" : "text-2xl")}
          transform={`rotate(90 ${center} ${center})`}
        >
          {total}
        </text>
      </svg>
      {showLegend && (
        <ul className="space-y-2">
          {data.map((d, i) => {
            if (d.value === 0) return null;
            return (
              <li key={d.label} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-slate-600">{d.label}</span>
                <span className="ml-auto font-medium text-slate-900">{d.value}</span>
                <span className="w-10 text-right text-xs text-slate-400">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
