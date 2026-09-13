"use client";

import type { ReportDocument, ReportSection } from "@/types/reports";
import { KpisView } from "./sections/KpisView";
import { InsightsView } from "./sections/InsightsView";
import { TrendView } from "./sections/TrendView";
import { BreakdownView } from "./sections/BreakdownView";
import { FunnelView } from "./sections/FunnelView";
import { TableView } from "./sections/TableView";
import { HeatmapView } from "./sections/HeatmapView";
import { NarrativeView } from "./sections/NarrativeView";

export function ReportRenderer({ doc }: { doc: ReportDocument }) {
  return (
    <div className="space-y-8">
      {doc.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} doc={doc} />
      ))}
    </div>
  );
}

function SectionRenderer({ section, doc }: { section: ReportSection; doc: ReportDocument }) {
  switch (section.kind) {
    case "kpis":
      return <KpisView section={section} meta={doc.meta} />;
    case "insights":
      return <InsightsView section={section} />;
    case "trend":
      return <TrendView section={section} meta={doc.meta} />;
    case "breakdown":
      return <BreakdownView section={section} meta={doc.meta} />;
    case "funnel":
      return <FunnelView section={section} />;
    case "table":
      return <TableView section={section} meta={doc.meta} />;
    case "heatmap":
      return <HeatmapView section={section} />;
    case "narrative":
      return <NarrativeView section={section} />;
    default:
      return null;
  }
}
