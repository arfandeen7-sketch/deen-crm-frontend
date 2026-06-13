import type { UserRole } from "@/types";

// Role permission matrix derived from backend spec.
// Frontend mirrors these to hide/show UI; the backend remains the source of truth.

export type Permission =
  | "leads.view.all"
  | "leads.delete"
  | "leads.import"
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
  "leads.assign": ["master", "sales_manager"],
  "brokers.create": ["master", "sales_manager"],
  "brokers.delete": ["master"],
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
