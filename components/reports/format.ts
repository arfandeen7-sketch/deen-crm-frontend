/**
 * Frontend value formatter — mirrors the backend format.util.ts 1:1.
 * Identical output for the same input so exports and UI never disagree.
 */
import type { ValueFormat } from "@/types/reports";

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatValue(
  value: string | number | null | undefined,
  format: ValueFormat,
  opts?: { currency?: string; compact?: boolean },
): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (format) {
    case "text":
      return String(value);

    case "number":
      return Math.round(Number(value)).toLocaleString("en-US");

    case "currency": {
      const n = Number(value);
      const currency = opts?.currency ?? "AED";
      if (opts?.compact) return `${currency} ${compactFormatter.format(n)}`;
      return `${currency} ${Math.round(n).toLocaleString("en-US")}`;
    }

    case "percent": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      return `${n.toFixed(1)}%`;
    }

    case "hours": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      if (n < 1) return `${Math.round(n * 60)}m`;
      const hours = Math.floor(n);
      const minutes = Math.round((n - hours) * 60);
      return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    }

    case "minutes": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      return `${Math.round(n)} min`;
    }

    case "days": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      const abs = Math.abs(n);
      const label = abs === 1 ? "day" : "days";
      return `${n.toFixed(1)} ${label}`;
    }

    case "clock": {
      const n = Number(value);
      if (!Number.isFinite(n)) return "—";
      const hours = Math.floor(n / 60);
      const minutes = Math.round(n % 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    case "date": {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return "—";
      const day = d.getUTCDate();
      const month = MONTHS_SHORT[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      return `${day} ${month} ${year}`;
    }

    case "datetime": {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return "—";
      const day = d.getUTCDate();
      const month = MONTHS_SHORT[d.getUTCMonth()];
      const year = d.getUTCFullYear();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${day} ${month} ${year}, ${hh}:${mm}`;
    }

    case "duration": {
      const totalSeconds = Number(value);
      if (!Number.isFinite(totalSeconds)) return "—";
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.round((totalSeconds % 3600) / 60);
      if (hours === 0) return `${minutes}m`;
      return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    }

    case "badge": {
      const s = String(value);
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    default:
      return String(value);
  }
}

/** Tailwind classes for badge severity. */
export function severityBadgeClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "positive":
      return "bg-teal-50 text-teal-700 border-teal-200";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-200";
  }
}

/** Severity dot color. */
export function severityDotClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    case "positive":
      return "bg-teal-600";
    default:
      return "bg-zinc-400";
  }
}
