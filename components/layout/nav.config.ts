import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users2,
  UserPlus,
  Upload,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  Handshake,
  Briefcase,
  ClipboardCheck,
  UserCog,
  SlidersHorizontal,
  KeyRound,
  Ghost,
  FileDown,
  UserCheck,
  UserX,
  BarChart2,
  Settings2,
  User,
  CalendarDays,
  Wallet,
  FileText,
  Mail,
  LogIn,
  PieChart,
} from "lucide-react";
import type { Permission } from "@/lib/rbac";
import { MANAGED_DYNAMIC_CATEGORIES } from "@/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Backend module key — if set, group is hidden unless user.modules includes it (prefix matched). */
  moduleKey?: string;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
    ],
  },
  {
    id: "leads",
    title: "Lead Management",
    icon: Users2,
    moduleKey: "leads",
    items: [
      { label: "All Leads", href: "/leads", icon: Users2 },
      { label: "Untouched Leads", href: "/leads/untouched", icon: Ghost },
      { label: "Imported Leads", href: "/leads/imported", icon: FileDown },
      { label: "Assigned Leads", href: "/leads/assigned", icon: UserCheck },
      { label: "Non Assigned Leads", href: "/leads/unassigned", icon: UserX },
      { label: "Create Lead", href: "/leads/create", icon: UserPlus },
      { label: "Import Leads", href: "/leads/import", icon: Upload, permission: "leads.import" },
      { label: "Lead Reports", href: "/leads/reports", icon: BarChart2 },
    ],
  },
  {
    id: "followup",
    title: "Follow Up Management",
    icon: CalendarClock,
    moduleKey: "followup",
    items: [
      { label: "Today's Follow Ups", href: "/followup/today", icon: CalendarCheck },
      { label: "Missed Follow Ups", href: "/followup/missed", icon: CalendarX },
      { label: "Upcoming Follow Ups", href: "/followup/upcoming", icon: CalendarPlus },
    ],
  },
  {
    id: "users",
    title: "User Management",
    icon: UserCog,
    moduleKey: "users",
    items: [
      { label: "All Users", href: "/users", icon: UserCog, permission: "users.manage" },
      { label: "Create User", href: "/users/create", icon: UserPlus, permission: "users.manage" },
    ],
  },
  {
    id: "hrms",
    title: "Human Resource Management",
    icon: Briefcase,
    moduleKey: "hrms",
    items: [
      { label: "HR Dashboard", href: "/hrms/dashboard", icon: LayoutDashboard, permission: "hrms.employees" },
      { label: "Employees", href: "/hrms/employees", icon: Users2, permission: "hrms.employees" },
      { label: "Attendance", href: "/hrms/attendance", icon: ClipboardCheck, permission: "hrms.attendance.manage" },
      { label: "Leave Management", href: "/hrms/leave", icon: CalendarDays, permission: "hrms.leave.manage" },
      { label: "Payroll Management", href: "/hrms/payroll", icon: Wallet, permission: "hrms.payroll" },
      { label: "Payslips", href: "/hrms/payslips", icon: FileText, permission: "hrms.payslip" },
      { label: "Email Configuration", href: "/hrms/email-config", icon: Mail, permission: "hrms.email" },
      { label: "Login Activity", href: "/hrms/login-activity", icon: LogIn, permission: "hrms.reports" },
      { label: "HR Reports", href: "/hrms/reports", icon: PieChart, permission: "hrms.reports" },
    ],
  },
  {
    id: "brokers",
    title: "Broker Management",
    icon: Handshake,
    moduleKey: "brokers",
    items: [
      { label: "All Brokers", href: "/brokers", icon: Handshake },
      { label: "Create Broker", href: "/brokers/create", icon: UserPlus },
    ],
  },
  {
    id: "my-hr",
    title: "My HR",
    icon: User,
    items: [
      { label: "My Attendance", href: "/my-hr/attendance", icon: ClipboardCheck },
      { label: "My Leaves", href: "/my-hr/leaves", icon: CalendarDays },
      { label: "My Payslips", href: "/my-hr/payslips", icon: FileText },
      { label: "My Profile", href: "/my-hr/profile", icon: User },
    ],
  },
  {
    id: "dynamic-fields",
    title: "Dynamic Fields",
    icon: SlidersHorizontal,
    moduleKey: "dynamic-fields",
    items: MANAGED_DYNAMIC_CATEGORIES.map(
      (c): NavItem => ({
        label: c.label,
        href: `/dynamic-fields/${c.slug}`,
        icon: SlidersHorizontal,
        permission: "dynamicFields.manage",
      }),
    ),
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings2,
    items: [
      { label: "Profile", href: "/settings/profile", icon: User },
      { label: "Change Password", href: "/settings/change-password", icon: KeyRound },
    ],
  },
];

// Re-export the followup icon used elsewhere if needed.
export const FollowUpIcon = CalendarClock;
