"use client";

import { cn } from "@/lib/utils";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

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
      <div className={cn("flex items-center justify-center text-sm text-slate-400", size === "sm" ? "h-20" : "h-44")}>
        No data available
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-6", size === "sm" ? "flex-row justify-start gap-3" : "flex-col sm:flex-row sm:justify-center")}>
      <svg viewBox={`0 0 ${box} ${box}`} className={cn(dim, "-rotate-90 shrink-0")}>
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const seg = (
            <circle
              key={d.label}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
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
          className={cn("rotate-90 fill-slate-900 font-semibold", size === "sm" ? "text-sm" : "text-2xl")}
          transform={`rotate(90 ${center} ${center})`}
        >
          {total}
        </text>
      </svg>
      {showLegend && (
        <ul className="space-y-2">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-slate-600">{d.label}</span>
              <span className="ml-auto font-medium text-slate-900">{d.value}</span>
              <span className="w-10 text-right text-xs text-slate-400">
                {Math.round((d.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
