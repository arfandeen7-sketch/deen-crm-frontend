/**
 * Frontend mirror of the backend ReportDocument contract.
 * Kept in sync with deen-crm-backend/src/services/reports/report.types.ts.
 */

export type ReportFormat = "json" | "pdf" | "xlsx" | "docx" | "csv";

export type ReportDomain = "sales" | "hr" | "portfolio";

export type ValueFormat =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "hours"
  | "minutes"
  | "days"
  | "clock"
  | "date"
  | "datetime"
  | "duration"
  | "badge";

export interface ReportMeta {
  key: string;
  title: string;
  subtitle: string;
  domain: ReportDomain;
  generatedAt: string;
  generatedBy: { userId: string; fullName: string; role: string };
  period: {
    key: string;
    label: string;
    start: string;
    end: string;
    granularity: "day" | "week" | "month";
    comparisonLabel: string;
  };
  scope: { label: string; userIds: string[] | null };
  filters: Array<{ label: string; value: string }>;
  currency: string;
  rowCount: number;
  formats: ReportFormat[];
  caveats: string[];
}

export interface ReportInsight {
  id: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  title: string;
  detail: string;
  href?: string;
}

export interface ReportKpi {
  key: string;
  label: string;
  value: number | null;
  format: ValueFormat;
  previous?: number | null;
  deltaPct?: number | null;
  invertDelta?: boolean;
  hint?: string;
  sparkline?: number[];
  href?: string;
  accent?: "ink" | "revenue" | "risk" | "negative" | "muted";
  target?: {
    good: number;
    warn: number;
    direction: "higher-is-better" | "lower-is-better";
  };
}

export interface ReportColumn {
  key: string;
  label: string;
  format: ValueFormat;
  align?: "left" | "right" | "center";
  total?: "sum" | "avg" | "none";
  width?: number;
  help?: string;
  compact?: boolean;
}

export type SectionKind =
  | "kpis"
  | "insights"
  | "trend"
  | "breakdown"
  | "funnel"
  | "table"
  | "heatmap"
  | "narrative";

interface SectionBase {
  id: string;
  kind: SectionKind;
  title: string;
  subtitle?: string;
  primary?: boolean;
  excludeFrom?: ReportFormat[];
}

export interface KpiSection extends SectionBase {
  kind: "kpis";
  items: ReportKpi[];
}

export interface InsightsSection extends SectionBase {
  kind: "insights";
  items: ReportInsight[];
}

export interface TrendSection extends SectionBase {
  kind: "trend";
  granularity: "day" | "week" | "month";
  series: Array<{
    key: string;
    label: string;
    format: ValueFormat;
    color: string;
    style: "area" | "line" | "bar";
    axis?: "left" | "right";
  }>;
  points: Array<Record<string, string | number>>;
}

export interface BreakdownSection extends SectionBase {
  kind: "breakdown";
  display: "donut" | "bars" | "stacked";
  valueFormat: ValueFormat;
  items: Array<{
    label: string;
    value: number;
    secondaryValue?: number;
    secondaryFormat?: ValueFormat;
    color?: string;
    href?: string;
  }>;
}

export interface FunnelSection extends SectionBase {
  kind: "funnel";
  stages: Array<{
    key: string;
    label: string;
    count: number;
    stageConversion: number;
    overallConversion: number;
    medianHours?: number | null;
  }>;
}

export interface TableSection extends SectionBase {
  kind: "table";
  columns: ReportColumn[];
  rows: Array<Record<string, string | number | null>>;
  previewLimit?: number;
  sheetName?: string;
  defaultSort?: { key: string; direction: "asc" | "desc" };
  severityKey?: string;
}

export interface HeatmapSection extends SectionBase {
  kind: "heatmap";
  xLabels: string[];
  yLabels: string[];
  valueFormat: ValueFormat;
  cells: Array<Array<number | null>>;
}

export interface NarrativeSection extends SectionBase {
  kind: "narrative";
  paragraphs: string[];
}

export type ReportSection =
  | KpiSection
  | InsightsSection
  | TrendSection
  | BreakdownSection
  | FunnelSection
  | TableSection
  | HeatmapSection
  | NarrativeSection;

export interface ReportDocument {
  meta: ReportMeta;
  sections: ReportSection[];
}

export interface ReportFilterSpec {
  key: string;
  label: string;
  type: "select" | "multiselect" | "text" | "date" | "month" | "toggle";
  options?: Array<{ value: string; label: string }>;
  optionsSource?:
    | "users"
    | "departments"
    | "sources"
    | "statuses"
    | "priorities"
    | "leaveTypes"
    | "projects"
    | "roles";
  placeholder?: string;
}

export interface ReportCatalogEntry {
  key: string;
  title: string;
  subtitle: string;
  domain: ReportDomain;
  formats: ReportFormat[];
  filterSpec: ReportFilterSpec[];
  audience: "sales" | "hr" | "any";
}

export interface FilterOption {
  value: string;
  label: string;
}
