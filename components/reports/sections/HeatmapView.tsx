"use client";

import { formatValue } from "../format";
import type { HeatmapSection } from "@/types/reports";

export function HeatmapView({ section }: { section: HeatmapSection }) {
  if (section.xLabels.length === 0 || section.yLabels.length === 0) return null;

  const maxVal = Math.max(
    ...section.cells.flat().filter((v): v is number => v !== null && v !== undefined),
    1,
  );

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{section.title}</h2>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-px" style={{ gridTemplateColumns: `80px repeat(${section.xLabels.length}, minmax(32px, 1fr))` }}>
          <div />
          {section.xLabels.map((xl) => (
            <div key={xl} className="px-1 py-1 text-center text-[10px] font-medium text-neutral-400">
              {xl}
            </div>
          ))}
          {section.yLabels.map((yl, y) => (
            <FragmentRow key={yl} label={yl} row={section.cells[y] ?? []} maxVal={maxVal} format={section.valueFormat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FragmentRow({
  label,
  row,
  maxVal,
  format,
}: {
  label: string;
  row: Array<number | null>;
  maxVal: number;
  format: import("@/types/reports").ValueFormat;
}) {
  return (
    <>
      <div className="flex items-center px-2 text-[11px] font-medium text-neutral-500">{label}</div>
      {row.map((val, x) => {
        if (val === null || val === undefined) {
          return <div key={x} className="aspect-square rounded-sm bg-neutral-50" />;
        }
        const alpha = 0.06 + 0.84 * (val / maxVal);
        const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
        return (
          <div
            key={x}
            className="flex aspect-square items-center justify-center rounded-sm text-[10px] font-medium tabular-nums text-neutral-700"
            style={{ backgroundColor: `#111111${hex}` }}
            title={formatValue(val, format)}
          >
            {val > 0 ? formatValue(val, format) : ""}
          </div>
        );
      })}
    </>
  );
}
