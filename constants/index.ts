import type { UserRole } from "@/types";

export const APP_NAME = "DEEN Properties CRM";

export const TOKEN_STORAGE_KEY = "deen_crm_token";

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

export const ROLE_LABELS: Record<UserRole, string> = {
  master: "Master Administrator",
  hr_manager: "HR Manager",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  master: "bg-violet-100 text-violet-700 ring-violet-600/20",
  hr_manager: "bg-pink-100 text-pink-700 ring-pink-600/20",
  sales_manager: "bg-blue-100 text-blue-700 ring-blue-600/20",
  sales_executive: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
};

// Lead status -> badge color (matches seeded lead_status values).
export const LEAD_STATUS_COLORS: Record<string, string> = {
  Fresh: "bg-sky-100 text-sky-700 ring-sky-600/20",
  Interested: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  "Existing Client": "bg-indigo-100 text-indigo-700 ring-indigo-600/20",
  Cold: "bg-slate-100 text-slate-600 ring-slate-500/20",
  "Not Interested": "bg-rose-100 text-rose-700 ring-rose-600/20",
  "No Answer Msg Dropped": "bg-amber-100 text-amber-700 ring-amber-600/20",
  "Not Receiving Calls": "bg-orange-100 text-orange-700 ring-orange-600/20",
};

export const LEAD_PRIORITY_COLORS: Record<string, string> = {
  Hot: "bg-rose-100 text-rose-700 ring-rose-600/20",
  Warm: "bg-amber-100 text-amber-700 ring-amber-600/20",
  Cold: "bg-sky-100 text-sky-700 ring-sky-600/20",
};

export const BROKER_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  suspended: "bg-rose-100 text-rose-700 ring-rose-600/20",
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  absent: "bg-rose-100 text-rose-700 ring-rose-600/20",
  half_day: "bg-amber-100 text-amber-700 ring-amber-600/20",
  late: "bg-orange-100 text-orange-700 ring-orange-600/20",
  leave: "bg-sky-100 text-sky-700 ring-sky-600/20",
  weekend: "bg-slate-100 text-slate-500 ring-slate-400/20",
  holiday: "bg-violet-100 text-violet-700 ring-violet-600/20",
};

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-100 text-rose-700 ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const PAYROLL_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  generated: "bg-sky-100 text-sky-700 ring-sky-600/20",
  sent: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
};

export const EMPLOYMENT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  on_leave: "bg-sky-100 text-sky-700 ring-sky-600/20",
  suspended: "bg-orange-100 text-orange-700 ring-orange-600/20",
  resigned: "bg-slate-100 text-slate-600 ring-slate-500/20",
  terminated: "bg-rose-100 text-rose-700 ring-rose-600/20",
};

// Official shift timing (Asia/Dubai)
export const SHIFT_CONFIG = {
  timezone: "Asia/Dubai",
  startTime: "09:30",
  endTime: "18:30",
  workingHours: 9,
  lateThreshold: "09:45",
  halfDayThreshold: "10:30",
} as const;

export const SERVICE_TYPES = ["Buy", "Sell", "Rent", "Mortgage"] as const;

// Categories managed in the Dynamic Fields screen.
// `slug` is the URL segment; `category` is the backend dynamic_fields.category value.
export const MANAGED_DYNAMIC_CATEGORIES = [
  { slug: "lead-status", category: "lead_status", label: "Lead Status" },
  { slug: "lead-priority", category: "lead_priority", label: "Lead Priority" },
  { slug: "lead-source", category: "source", label: "Lead Source" },
  { slug: "projects", category: "project_name", label: "Project Names" },
  { slug: "department", category: "department", label: "Departments" },
  { slug: "designation", category: "designation", label: "Designations" },
  { slug: "bank-name", category: "bank_name", label: "Bank Names" },
] as const;
