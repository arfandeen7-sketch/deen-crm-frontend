"use client";

import { cn } from "@/lib/utils";

export interface SparklineDatum {
  date: string;
  count: number;
}

/** Compact 7-day activity trend line used inside employee performance cards. */
export function Sparkline({
  data,
  color = "#6366f1",
  className,
}: {
  data: SparklineDatum[];
  color?: string;
  className?: string;
}) {
  const width = 120;
  const height = 32;
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return <div className={cn("h-8 text-xs text-slate-400", className)}>No activity</div>;
  }

  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * step : width / 2;
    const y = height - (d.count / max) * height;
    return `${x},${y}`;
  });

  const last = data[data.length - 1];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-28 shrink-0">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = data.length > 1 ? i * step : width / 2;
          const y = height - (d.count / max) * height;
          return <circle key={d.date} cx={x} cy={y} r={1.5} fill={color} />;
        })}
      </svg>
      <span className="text-xs text-slate-500">{last?.count ?? 0} today</span>
    </div>
  );
}
