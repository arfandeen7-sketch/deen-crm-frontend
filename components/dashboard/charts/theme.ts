/**
 * Dashboard chart theme.
 *
 * Deliberately monochrome-first to match the brand tokens in app/globals.css:
 * ink (#111111) carries the primary series, graphite/mist carry supporting
 * series, and colour is reserved for meaning (revenue, risk, negative).
 *
 * The rainbow `CHART_COLORS` palette in components/charts/palette.ts stays with
 * the chart.js report pages — dashboards use this restrained set instead.
 */

/** Brand-derived series colours. */
export const SERIES = {
  ink: "#111111",
  graphite: "#3F3F46",
  mist: "#A1A1AA",
  hairline: "#E8E8E8",
  revenue: "#0F766E",
  revenueSoft: "#14B8A6",
  risk: "#B45309",
  riskSoft: "#F59E0B",
  negative: "#B91C1C",
  negativeSoft: "#EF4444",
  positive: "#047857",
  neutralSurface: "#F7F7F7",
} as const;

/**
 * Categorical ramp for breakdowns (sources, departments, statuses).
 * Reads as a single tonal family so no chart looks like a pie of confetti.
 */
export const CATEGORICAL = [
  "#111111",
  "#3F3F46",
  "#0F766E",
  "#52525B",
  "#14B8A6",
  "#71717A",
  "#B45309",
  "#A1A1AA",
  "#5EEAD4",
  "#D4D4D8",
] as const;

export function categoricalColor(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length];
}

/** Semantic colours for lead statuses that carry meaning across dashboards. */
export const STATUS_COLOR: Record<string, string> = {
  "Deal Closed": SERIES.revenue,
  Interested: SERIES.positive,
  "Existing Client": SERIES.revenueSoft,
  Fresh: SERIES.ink,
  Cold: SERIES.mist,
  "Not Interested": SERIES.negative,
  "Not Receiving Calls": SERIES.risk,
  "No Answer Msg Dropped": SERIES.riskSoft,
};

export function statusColor(status: string, fallbackIndex = 0): string {
  return STATUS_COLOR[status] ?? categoricalColor(fallbackIndex);
}

/** Attendance status colours shared by the HR widgets. */
export const ATTENDANCE_COLOR = {
  present: SERIES.revenue,
  late: SERIES.riskSoft,
  halfDay: SERIES.risk,
  absent: SERIES.negativeSoft,
  onLeave: SERIES.graphite,
  notCheckedIn: SERIES.mist,
} as const;

// ── Recharts shared props ───────────────────────────────────────────────────

/** Axis defaults: hairline ticks, no axis lines, DM Sans at 11px. */
export const AXIS_PROPS = {
  stroke: SERIES.mist,
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: "#8A8A8A", fontFamily: "var(--font-dm-sans)" },
} as const;

/** Horizontal-only gridlines, matching the app's hairline borders. */
export const GRID_PROPS = {
  stroke: SERIES.hairline,
  strokeDasharray: "3 3",
  vertical: false,
} as const;

export const CURSOR_PROPS = {
  fill: "rgba(17, 17, 17, 0.04)",
} as const;

// ── Formatters ──────────────────────────────────────────────────────────────

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCompact(value: number): string {
  return compact.format(value ?? 0);
}

export function formatNumber(value: number): string {
  return Math.round(value ?? 0).toLocaleString();
}

/** AED with no decimals — the app never shows fils. */
export function formatAed(value: number, options?: { compact?: boolean }): string {
  const amount = value ?? 0;
  if (options?.compact) return `AED ${compact.format(amount)}`;
  return `AED ${Math.round(amount).toLocaleString()}`;
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** Hours as "3h 20m", or "—" when there is no sample. */
export function formatHours(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value < 1) return `${Math.round(value * 60)}m`;
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/** Minutes past midnight as "09:42". */
export function formatClockMinutes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Formats an ISO day key (`2026-09-12`) for an axis tick.
 * Granularity decides whether the day number or the month is more useful.
 */
export function formatBucketLabel(
  bucket: string,
  granularity: "day" | "week" | "month",
): string {
  const date = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return bucket;

  if (granularity === "month") {
    return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  }
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatFullDate(bucket: string): string {
  const date = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return bucket;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
