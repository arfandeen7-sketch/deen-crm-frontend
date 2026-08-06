import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string as a short, locale-friendly date. */
export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });
}

/**
 * Convert an ISO date/datetime string to the value format required by
 * `<input type="datetime-local">` — "YYYY-MM-DDTHH:MM" in local time.
 */
export function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Format an ISO date string with time. */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

/** Relative time like "3h ago". */
export function timeAgo(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Initials from a full name, e.g. "Ahmed Khan" -> "AK". */
export function initials(name?: string | null): string {
  if (!name) return "?";
  const cleaned = displayValue(name, "");
  if (!cleaned) return "?";
  return cleaned
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Display helper for lead/import fields. Blank values and import placeholders
 * (`N/A`, `-`) render as an em dash so empty CSV cells look intentional.
 */
export function displayValue(
  value?: string | number | null,
  fallback = "—",
): string {
  if (value == null) return fallback;
  const trimmed = String(value).trim();
  if (!trimmed) return fallback;
  const upper = trimmed.toUpperCase();
  if (upper === "N/A" || trimmed === "-" || trimmed === "—") return fallback;
  return trimmed;
}

/** True when a stored value is blank or an import empty-cell placeholder. */
export function isEmptyDisplayValue(value?: string | null): boolean {
  return displayValue(value, "") === "";
}

/** Build a query string from a params object, skipping empty values. */
export function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Trigger a browser download from a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Human-friendly label from a snake_case or camelCase token. */
export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format a number as currency with AED symbol. */
export function formatCurrency(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Extract error message from API error response. */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const err = error as any;
    if (err.response?.data?.error) return err.response.data.error;
    if (err.response?.data?.message) return err.response.data.message;
    if (err.message) return err.message;
  }
  return "An unexpected error occurred";
}
