import {
  UserPlus,
  Upload,
  BarChart2,
  Handshake,
  Briefcase,
  Users2,
  Mail,
  FileText,
  CalendarCheck,
  CalendarClock,
  Receipt,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}

export const ROLE_QUICK_ACTIONS: Record<UserRole, QuickAction[]> = {
  master: [
    { label: "Create Lead", href: "/leads/create", icon: UserPlus, accent: "text-gray-900 bg-indigo-50" },
    { label: "Import Leads", href: "/leads/import", icon: Upload, accent: "text-emerald-600 bg-emerald-50" },
    { label: "Lead Reports", href: "/leads/reports", icon: BarChart2, accent: "text-sky-600 bg-sky-50" },
    { label: "Add Broker", href: "/brokers/create", icon: Handshake, accent: "text-amber-600 bg-amber-50" },
    { label: "Add Candidate", href: "/hrms/employees/create", icon: Briefcase, accent: "text-violet-600 bg-violet-50" },
  ],
  hr_manager: [
    { label: "Add Employee", href: "/hrms/employees/create", icon: UserPlus, accent: "text-gray-900 bg-indigo-50" },
    { label: "Review Leaves", href: "/hrms/leave", icon: ClipboardList, accent: "text-amber-600 bg-amber-50" },
    { label: "Generate Payslip", href: "/hrms/payroll", icon: Receipt, accent: "text-emerald-600 bg-emerald-50" },
    { label: "Email Config", href: "/hrms/email-config", icon: Mail, accent: "text-sky-600 bg-sky-50" },
    { label: "HR Reports", href: "/hrms/reports", icon: BarChart2, accent: "text-violet-600 bg-violet-50" },
  ],
  sales_manager: [
    { label: "Create Lead", href: "/leads/create", icon: UserPlus, accent: "text-gray-900 bg-indigo-50" },
    { label: "Import Leads", href: "/leads/import", icon: Upload, accent: "text-emerald-600 bg-emerald-50" },
    { label: "Lead Reports", href: "/leads/reports", icon: BarChart2, accent: "text-sky-600 bg-sky-50" },
    { label: "Add Broker", href: "/brokers/create", icon: Handshake, accent: "text-amber-600 bg-amber-50" },
    { label: "My Team", href: "/my-team", icon: Users2, accent: "text-violet-600 bg-violet-50" },
  ],
  sales_executive: [
    { label: "Create Lead", href: "/leads/create", icon: UserPlus, accent: "text-gray-900 bg-indigo-50" },
    { label: "My Follow-ups", href: "/followup/today", icon: CalendarCheck, accent: "text-emerald-600 bg-emerald-50" },
    { label: "My Attendance", href: "/my-hr/attendance", icon: CalendarClock, accent: "text-sky-600 bg-sky-50" },
    { label: "Apply Leave", href: "/my-hr/leaves", icon: ClipboardList, accent: "text-amber-600 bg-amber-50" },
    { label: "My Payslips", href: "/my-hr/payslips", icon: FileText, accent: "text-violet-600 bg-violet-50" },
  ],
};
