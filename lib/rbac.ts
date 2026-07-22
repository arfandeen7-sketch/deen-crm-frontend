import type { UserRole } from "@/types";

// Role permission matrix derived from backend spec.
// Frontend mirrors these to hide/show UI; the backend remains the source of truth.

export type Permission =
  | "leads.view.all"
  | "leads.delete"
  | "leads.import"
  | "leads.reports"
  | "leads.assign"
  | "brokers.create"
  | "brokers.delete"
  | "brokers.import"
  | "hrms.employees"
  | "hrms.attendance.manage"
  | "hrms.leave.manage"
  | "hrms.payroll"
  | "hrms.payslip"
  | "hrms.email"
  | "hrms.reports"
  | "users.manage"
  | "dynamicFields.manage";

const MATRIX: Record<Permission, UserRole[]> = {
  "leads.view.all": ["master", "sales_manager"],
  "leads.delete": ["master"],
  "leads.import": ["master", "sales_manager"],
  "leads.reports": ["master"],
  "leads.assign": ["master", "sales_manager"],
  "brokers.create": ["master", "sales_manager"],
  "brokers.delete": ["master", "sales_manager"],
  "brokers.import": ["master"],
  "hrms.employees": ["master", "hr_manager"],
  "hrms.attendance.manage": ["master", "hr_manager"],
  "hrms.leave.manage": ["master", "hr_manager"],
  "hrms.payroll": ["master", "hr_manager"],
  "hrms.payslip": ["master", "hr_manager"],
  "hrms.email": ["master", "hr_manager"],
  "hrms.reports": ["master", "hr_manager"],
  "users.manage": ["master"],
  "dynamicFields.manage": ["master"],
};

export function can(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return MATRIX[permission].includes(role);
}

/**
 * Default module keys each role can access when no custom override is set.
 * Groups in nav.config.ts use these moduleKeys.
 * Groups without a moduleKey are always visible.
 */
export const ROLE_DEFAULT_MODULES: Record<UserRole, string[]> = {
  master: ["leads", "followup", "users", "hrms", "my_hr", "brokers", "dynamic-fields"],
  hr_manager: ["hrms", "my_hr"],
  sales_manager: ["leads", "followup", "brokers", "my_hr"],
  sales_executive: ["leads", "followup", "my_hr"],
};
