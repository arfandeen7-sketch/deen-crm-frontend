"use client";

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

export function DonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 70;
  const stroke = 26;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 180 180" className="h-44 w-44 -rotate-90">
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const seg = (
            <circle
              key={d.label}
              cx="90"
              cy="90"
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
          x="90"
          y="90"
          textAnchor="middle"
          dominantBaseline="middle"
          className="rotate-90 fill-slate-900 text-2xl font-semibold"
          transform="rotate(90 90 90)"
        >
          {total}
        </text>
      </svg>
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
    </div>
  );
}
