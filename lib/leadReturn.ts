import { PAGE_SIZES } from "@/constants";

/**
 * Lead detail is opened from several lists (All Leads, Untouched, follow-ups, …).
 * The `from` query records that list. Filters themselves are kept in sessionStorage
 * so returning to the list restores search, page, and the rest of the previous view.
 */

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RETURN_PATHS = new Set([
  "/leads",
  "/leads/untouched",
  "/leads/fresh",
  "/leads/imported",
  "/leads/assigned",
  "/leads/unassigned",
  "/leads/deal-closed",
  "/followup/today",
  "/followup/missed",
  "/followup/upcoming",
]);

const RETURN_LABELS: Record<string, string> = {
  "/leads": "Back to leads",
  "/leads/untouched": "Back to Untouched leads",
  "/leads/fresh": "Back to Fresh leads",
  "/leads/imported": "Back to Imported leads",
  "/leads/assigned": "Back to Assigned leads",
  "/leads/unassigned": "Back to Non Assigned leads",
  "/leads/deal-closed": "Back to Deal Closed",
  "/followup/today": "Back to Today's follow-ups",
  "/followup/missed": "Back to Missed follow-ups",
  "/followup/upcoming": "Back to Upcoming follow-ups",
};

export const ALL_LEADS_LIST_KEY = "deen:list-state:leads";
export const DEAL_CLOSED_LIST_KEY = "deen:list-state:leads:deal-closed";

export function typedLeadListKey(
  category: "fresh" | "untouched" | "imported" | "assigned" | "unassigned",
): string {
  return `deen:list-state:leads:${category}`;
}

export function followupListKey(variant: "today" | "missed" | "upcoming"): string {
  return `deen:list-state:followup:${variant}`;
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

type FieldSpec =
  | { kind: "string"; max?: number }
  | { kind: "uuid" }
  | { kind: "date" }
  | { kind: "int"; min: number; max: number }
  | { kind: "oneOf"; values: readonly number[] }
  | { kind: "enum"; values: readonly string[] };

export type ListStateSpec = Record<string, FieldSpec>;

const pageField: FieldSpec = { kind: "int", min: 1, max: 10_000 };
const pageSizeField: FieldSpec = { kind: "oneOf", values: PAGE_SIZES };
const searchField: FieldSpec = { kind: "string", max: 200 };
const dateField: FieldSpec = { kind: "date" };
const labelField: FieldSpec = { kind: "string", max: 120 };

export const LEAD_LIST_FIELDS: ListStateSpec = {
  page: pageField,
  pageSize: pageSizeField,
  search: searchField,
  source: labelField,
  status: labelField,
  assignedTo: { kind: "uuid" },
  nationality: labelField,
  serviceType: labelField,
  projectName: labelField,
  city: labelField,
  locality: labelField,
  community: labelField,
  dateFrom: dateField,
  dateTo: dateField,
  dateField: { kind: "enum", values: ["master_assigned", "manual", "pf_enquiry", "closed"] },
  projectType: labelField,
  configuration: labelField,
  ingestionSource: labelField,
  leadPriority: labelField,
  brokerId: { kind: "uuid" },
  category: { kind: "enum", values: ["fresh", "untouched", "imported", "assigned", "unassigned"] },
};

export const TYPED_LEAD_LIST_FIELDS: ListStateSpec = {
  page: pageField,
  pageSize: pageSizeField,
  search: searchField,
  status: labelField,
  source: labelField,
  assignedTo: { kind: "uuid" },
  dateFrom: dateField,
  dateTo: dateField,
};

export const DEAL_CLOSED_LIST_FIELDS: ListStateSpec = {
  ...LEAD_LIST_FIELDS,
  sortBy: {
    kind: "enum",
    values: ["closedAt", "updatedAt", "leadName", "source", "createdAt", "price", "salesValue", "status"],
  },
  sortDir: { kind: "enum", values: ["asc", "desc"] },
};

export const FOLLOWUP_LIST_FIELDS: ListStateSpec = {
  page: pageField,
  pageSize: pageSizeField,
  search: searchField,
  view: { kind: "enum", values: ["table", "calendar"] },
};

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): KeyValueStore | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function sanitizeField(value: unknown, spec: FieldSpec): string | number | undefined {
  if (value == null || value === "") return undefined;
  switch (spec.kind) {
    case "string": {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed || trimmed.length > (spec.max ?? 120)) return undefined;
      if (/[\u0000-\u001F\u007F<>]/.test(trimmed)) return undefined;
      return trimmed;
    }
    case "uuid": {
      if (typeof value !== "string" || !UUID.test(value)) return undefined;
      return value.toLowerCase();
    }
    case "date": {
      if (typeof value !== "string" || !isIsoDate(value)) return undefined;
      return value;
    }
    case "int": {
      const numeric = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
      if (!Number.isInteger(numeric) || numeric < spec.min || numeric > spec.max) return undefined;
      return numeric;
    }
    case "oneOf": {
      if (typeof value !== "number" || !spec.values.includes(value)) return undefined;
      return value;
    }
    case "enum": {
      if (typeof value !== "string" || !spec.values.includes(value)) return undefined;
      return value;
    }
    default:
      return undefined;
  }
}

/** Keep only known list-filter fields. Unknown or malformed values are dropped. */
export function sanitizeListState(raw: unknown, spec: ListStateSpec): Record<string, string | number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const next: Record<string, string | number> = {};
  for (const [key, field] of Object.entries(spec)) {
    if (!(key in raw)) continue;
    const value = sanitizeField((raw as Record<string, unknown>)[key], field);
    if (value !== undefined) next[key] = value;
  }
  return next;
}

export function readListState(
  key: string,
  spec: ListStateSpec,
  storage: KeyValueStore | null = browserStorage(),
): Record<string, string | number> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return sanitizeListState(JSON.parse(raw), spec);
  } catch {
    return null;
  }
}

export function writeListState(
  key: string,
  state: object,
  spec: ListStateSpec,
  storage: KeyValueStore | null = browserStorage(),
): void {
  if (!storage) return;
  const sanitized = sanitizeListState(state, spec);
  if (!sanitized) return;
  try {
    storage.setItem(key, JSON.stringify(sanitized));
  } catch {
    // Ignore quota and privacy-mode failures. The in-memory list still works.
  }
}

function leadPath(id: string): string {
  const segment = UUID.test(id) ? id : encodeURIComponent(id);
  return `/leads/${segment}`;
}

/**
 * Accept only in-app lead and follow-up list URLs.
 * Query strings are limited to the All Leads notification params.
 */
export function sanitizeReturnTo(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) return null;
  if (trimmed.includes("\\") || trimmed.includes("://") || trimmed.includes("\0")) return null;

  let url: URL;
  try {
    url = new URL(trimmed, "http://localhost");
  } catch {
    return null;
  }
  if (url.origin !== "http://localhost") return null;

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (!RETURN_PATHS.has(path)) return null;

  if (path !== "/leads") return path;

  const params = new URLSearchParams();
  const leadIds = url.searchParams.get("leadIds");
  if (leadIds) {
    const ids = leadIds.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length > 0 && ids.length <= 100 && ids.every((id) => UUID.test(id))) {
      params.set("leadIds", ids.join(","));
    }
  }
  const assignedTo = url.searchParams.get("assignedTo");
  if (assignedTo && UUID.test(assignedTo)) params.set("assignedTo", assignedTo.toLowerCase());
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function buildLeadDetailHref(id: string, returnTo?: string | null): string {
  const path = leadPath(id);
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return path;
  return `${path}?from=${encodeURIComponent(safe)}`;
}

export function buildLeadEditHref(id: string, returnTo?: string | null): string {
  const detail = buildLeadDetailHref(id, returnTo);
  const queryAt = detail.indexOf("?");
  if (queryAt === -1) return `${detail}/edit`;
  return `${detail.slice(0, queryAt)}/edit${detail.slice(queryAt)}`;
}

export function resolveLeadBackLink(
  from: string | null | undefined,
  locked = false,
): { href: string; label: string } {
  const safe = sanitizeReturnTo(from);
  if (safe) {
    const path = safe.split("?")[0];
    return { href: safe, label: RETURN_LABELS[path] ?? "Back to leads" };
  }
  if (locked) return { href: "/leads/deal-closed", label: "Back to Deal Closed" };
  return { href: "/leads", label: "Back to leads" };
}
