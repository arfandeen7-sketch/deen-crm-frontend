import { Clock, Check, X, Ban } from "lucide-react";
import type { LeaveStatus, LeaveCalendarDay } from "@/types";

// ── Calendar day colors ──────────────────────────────────────────────────────

export const calendarDayColors: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800",
  late: "bg-amber-100 text-amber-800",
  half_day: "bg-orange-100 text-orange-800",
  absent: "bg-rose-100 text-rose-800",
  leave: "bg-sky-100 text-sky-800",
  holiday: "bg-violet-100 text-violet-800",
  weekend: "bg-slate-100 text-slate-500",
};

export const leaveStatusConfig: Record<
  LeaveStatus,
  { label: string; badgeClass: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", badgeClass: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", badgeClass: "bg-emerald-100 text-emerald-700", icon: Check },
  rejected: { label: "Rejected", badgeClass: "bg-rose-100 text-rose-700", icon: X },
  cancelled: { label: "Cancelled", badgeClass: "bg-slate-100 text-slate-500", icon: Ban },
};

// ── Working days calculation ─────────────────────────────────────────────────

export function calculateWorkingDays(
  from: Date,
  to: Date,
  weekendDays: number[] = [5, 6],
  holidays: string[] = [],
): number {
  let count = 0;
  const cur = new Date(from);
  while (cur <= to) {
    const dayStr = cur.toISOString().split("T")[0];
    if (!weekendDays.includes(cur.getDay()) && !holidays.includes(dayStr)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ── Balance color helper ─────────────────────────────────────────────────────

export function balanceColor(available: number): string {
  if (available <= 0) return "text-rose-600";
  if (available <= 5) return "text-amber-600";
  return "text-emerald-600";
}

export function balanceBgColor(available: number): string {
  if (available <= 0) return "bg-rose-50 border-rose-200";
  if (available <= 5) return "bg-amber-50 border-amber-200";
  return "bg-emerald-50 border-emerald-200";
}

// ── Audit trail colors ───────────────────────────────────────────────────────

export const auditActionColors: Record<string, string> = {
  created: "bg-sky-500",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
  cancelled: "bg-slate-400",
  updated: "bg-amber-500",
};

export function getAuditColor(action: string): string {
  const key = action.toLowerCase();
  if (key.includes("create")) return auditActionColors.created;
  if (key.includes("approve")) return auditActionColors.approved;
  if (key.includes("reject")) return auditActionColors.rejected;
  if (key.includes("cancel")) return auditActionColors.cancelled;
  return auditActionColors.updated;
}

// ── Calendar helpers ─────────────────────────────────────────────────────────

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function findCalendarDay(
  days: LeaveCalendarDay[],
  dateKey: string,
): LeaveCalendarDay | undefined {
  return days.find((d) => d.date === dateKey);
}

// ── Month / year helpers ─────────────────────────────────────────────────────

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
