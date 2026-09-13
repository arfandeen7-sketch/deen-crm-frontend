"use client";

import { KpiTile, KpiRow } from "@/components/dashboard/kpi/KpiTile";
import { formatValue } from "../format";
import type { KpiSection, ReportMeta } from "@/types/reports";

export function KpisView({ section, meta }: { section: KpiSection; meta: ReportMeta }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
        {section.title}
      </h2>
      <KpiRow>
        {section.items.map((kpi) => (
          <KpiTile
            key={kpi.key}
            label={kpi.label}
            value={formatValue(kpi.value, kpi.format, { currency: meta.currency })}
            hint={kpi.hint}
            delta={kpi.deltaPct ?? undefined}
            invertDelta={kpi.invertDelta}
            deltaLabel={meta.period.comparisonLabel}
            accent={kpi.accent ?? "ink"}
            sparkline={kpi.sparkline}
            href={kpi.href}
          />
        ))}
      </KpiRow>
    </section>
  );
}
