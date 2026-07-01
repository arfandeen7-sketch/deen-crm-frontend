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
  const max = Math.max(1, ...data.map((d) => d.count || 0));
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);

  if (data.length === 0) {
    return <div className={cn("h-8 flex items-center text-xs text-slate-400", className)}>No activity</div>;
  }

  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * step : width / 2;
    // Keep the line slightly above the very bottom even for 0 so it's not clipped
    const count = d.count || 0;
    const y = height - (count / max) * (height - 2) - 1;
    return `${x},${y}`;
  });

  const last = data[data.length - 1];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-8 w-24 shrink-0 overflow-hidden">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={total === 0 ? "#cbd5e1" : color} // muted color if no activity
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = data.length > 1 ? i * step : width / 2;
          const count = d.count || 0;
          const y = height - (count / max) * (height - 2) - 1;
          return (
            <circle 
              key={d.date || i} 
              cx={x} 
              cy={y} 
              r={1.5} 
              fill={total === 0 ? "#cbd5e1" : color} 
            />
          );
        })}
      </svg>
      <span className="text-[10px] text-slate-500 font-medium truncate">
        {total === 0 ? "0 this week" : `${last?.count ?? 0} today`}
      </span>
    </div>
  );
}
