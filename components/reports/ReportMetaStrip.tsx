"use client";

import type { ReportMeta } from "@/types/reports";

export function ReportMetaStrip({ meta }: { meta: ReportMeta }) {
  const items = [
    { label: "Period", value: meta.period.label },
    { label: "Scope", value: meta.scope.label },
    { label: "Records", value: String(meta.rowCount) },
    { label: "Generated", value: meta.generatedAt.slice(0, 10) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-neutral-200/80 py-2 text-xs">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-neutral-300">·</span>}
          <span className="font-medium uppercase tracking-wider text-neutral-400">{item.label}</span>
          <span className="font-medium text-neutral-700">{item.value}</span>
        </div>
      ))}
      {meta.filters.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-300">·</span>
          <span className="font-medium uppercase tracking-wider text-neutral-400">Filters</span>
          <span className="font-medium text-neutral-700">
            {meta.filters.map((f) => `${f.label}: ${f.value}`).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
